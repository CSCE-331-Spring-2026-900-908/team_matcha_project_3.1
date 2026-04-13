import { NextResponse } from 'next/server';
import pool from '@/lib/db';

type SummaryRow = {
  sales_total: string;
  order_count: string;
  return_total: string;
  return_count: string;
};

type HourlyRow = {
  hour_of_day: string;
  sales_total: string;
  order_count: string;
};

type ZRunLogRow = {
  already_ran: number;
};

async function hasStatusColumn(
  client: Awaited<ReturnType<typeof pool.connect>>
) {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'orders'
        AND column_name = 'status'
    ) AS exists;`
  );
  return result.rows[0]?.exists ?? false;
}

async function getReportSnapshot(
  client: Awaited<ReturnType<typeof pool.connect>>,
  targetDate: string,
  supportsStatus: boolean
) {
  const returnStatusClause = supportsStatus
    ? " OR LOWER(COALESCE(status, '')) LIKE '%return%'"
    : '';

  const summaryResult = await client.query<SummaryRow>(
    `SELECT
      COALESCE(SUM(costtotal) FILTER (WHERE COALESCE(costtotal, 0) > 0), 0)::numeric AS sales_total,
      COUNT(*) FILTER (WHERE COALESCE(costtotal, 0) > 0)::int AS order_count,
      COALESCE(ABS(SUM(costtotal) FILTER (WHERE COALESCE(costtotal, 0) < 0)), 0)::numeric AS return_total,
      COUNT(*) FILTER (
        WHERE COALESCE(costtotal, 0) < 0
        ${returnStatusClause}
      )::int AS return_count
    FROM orders
    WHERE DATE(orderdatetime) = $1::date;`,
    [targetDate]
  );

  const hourlyResult = await client.query<HourlyRow>(
    `SELECT
      EXTRACT(HOUR FROM orderdatetime)::int AS hour_of_day,
      COALESCE(SUM(costtotal) FILTER (WHERE COALESCE(costtotal, 0) > 0), 0)::numeric AS sales_total,
      COUNT(*) FILTER (WHERE COALESCE(costtotal, 0) > 0)::int AS order_count
    FROM orders
    WHERE DATE(orderdatetime) = $1::date
    GROUP BY EXTRACT(HOUR FROM orderdatetime)
    ORDER BY hour_of_day ASC;`,
    [targetDate]
  );

  const summary = summaryResult.rows[0] ?? {
    sales_total: '0',
    order_count: '0',
    return_total: '0',
    return_count: '0',
  };

  return {
    date: targetDate,
    summary: {
      salesTotal: Number(summary.sales_total),
      orderCount: Number(summary.order_count),
      returnTotal: Number(summary.return_total),
      returnCount: Number(summary.return_count),
    },
    hourly: hourlyResult.rows.map((row) => ({
      hourOfDay: Number(row.hour_of_day),
      salesTotal: Number(row.sales_total),
      orderCount: Number(row.order_count),
    })),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = (searchParams.get('type') ?? 'x').toLowerCase();
  const targetDate = searchParams.get('date') ?? new Date().toISOString().slice(0, 10);

  if (type !== 'x' && type !== 'z') {
    return NextResponse.json(
      { error: "Invalid report type. Use 'x' or 'z'." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    const supportsStatus = await hasStatusColumn(client);
    const snapshot = await getReportSnapshot(client, targetDate, supportsStatus);

    return NextResponse.json({
      type,
      report: snapshot,
      hasSideEffects: false,
      message:
        type === 'x'
          ? 'X-report generated successfully.'
          : 'Z-report preview generated. Use POST with type=z to close the day.',
    });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report.' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const type = String(body?.type ?? '').toLowerCase();
  const targetDate = body?.date ?? new Date().toISOString().slice(0, 10);

  if (type !== 'z') {
    return NextResponse.json(
      { error: "Only Z-report supports side effects. Send { type: 'z' }." },
      { status: 400 }
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const supportsStatus = await hasStatusColumn(client);

    await client.query(
      'CREATE TABLE IF NOT EXISTS z_report_log (run_date DATE PRIMARY KEY);'
    );

    const alreadyRanResult = await client.query<ZRunLogRow>(
      'SELECT COUNT(*)::int AS already_ran FROM z_report_log WHERE run_date = $1::date;',
      [targetDate]
    );
    const alreadyRan = alreadyRanResult.rows[0]?.already_ran ?? 0;

    if (alreadyRan > 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: 'Z-report has already been run for this date.' },
        { status: 409 }
      );
    }

    const snapshot = await getReportSnapshot(client, targetDate, supportsStatus);

    await client.query('INSERT INTO z_report_log (run_date) VALUES ($1::date);', [
      targetDate,
    ]);
    await client.query('DELETE FROM orders_today WHERE DATE(created_at) = $1::date;', [
      targetDate,
    ]);
    await client.query(
      'INSERT INTO orders_today (sales, created_at) VALUES (0, NOW());'
    );

    await client.query('COMMIT');

    return NextResponse.json({
      type: 'z',
      report: snapshot,
      hasSideEffects: true,
      resetPerformed: true,
      message: 'Z-report generated and daily running totals were reset.',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to run Z-report:', error);
    return NextResponse.json({ error: 'Failed to run Z-report.' }, { status: 500 });
  } finally {
    client.release();
  }
}
