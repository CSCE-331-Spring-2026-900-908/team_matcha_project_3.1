import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { withAuth } from '@/lib/middleware-utils';
import { getDefaultAnalyticsDateRange, getTopSellers } from '@/lib/analytics';

type SummaryRow = {
  total_orders: string;
  total_revenue: string;
  average_order_value: string;
  pending_orders: string;
};

type DailyTrendRow = {
  day: string;
  revenue: string;
  orders: string;
};

type HourlyTrendRow = {
  hour_of_day: string;
  orders: string;
};

type PriceDistributionRow = {
  bucket: string;
  item_count: string;
};

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getDefaultDateRange() {
  return getDefaultAnalyticsDateRange();
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    const { searchParams } = new URL(request.url);
    const defaultRange = getDefaultDateRange();

    const startDate = searchParams.get('startDate') ?? defaultRange.start;
    const endDate = searchParams.get('endDate') ?? defaultRange.end;

    if (!isIsoDate(startDate) || !isIsoDate(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'Start date must be before or equal to end date.' },
        { status: 400 }
      );
    }

    const client = await pool.connect();

    try {
      const [summaryResult, dailyTrendResult, topSellersResult, hourlyTrendResult, distributionResult] =
        await Promise.all([
          client.query<SummaryRow>(
            `SELECT
              COUNT(*)::int AS total_orders,
              COALESCE(SUM(costtotal), 0)::numeric AS total_revenue,
              COALESCE(AVG(costtotal), 0)::numeric AS average_order_value,
              0::int AS pending_orders
            FROM orders
            WHERE orderdatetime >= $1::date
              AND orderdatetime < ($2::date + INTERVAL '1 day');`,
            [startDate, endDate]
          ),
          client.query<DailyTrendRow>(
            `SELECT
              TO_CHAR(DATE(orderdatetime), 'YYYY-MM-DD') AS day,
              COALESCE(SUM(costtotal), 0)::numeric AS revenue,
              COUNT(*)::int AS orders
            FROM orders
            WHERE orderdatetime >= $1::date
              AND orderdatetime < ($2::date + INTERVAL '1 day')
            GROUP BY DATE(orderdatetime)
            ORDER BY DATE(orderdatetime) ASC;`,
            [startDate, endDate]
          ),
          getTopSellers(startDate, endDate, 5),
          client.query<HourlyTrendRow>(
            `SELECT
              EXTRACT(HOUR FROM orderdatetime)::int AS hour_of_day,
              COUNT(*)::int AS orders
            FROM orders
            WHERE orderdatetime >= $1::date
              AND orderdatetime < ($2::date + INTERVAL '1 day')
            GROUP BY EXTRACT(HOUR FROM orderdatetime)
            ORDER BY hour_of_day ASC;`,
            [startDate, endDate]
          ),
          client.query<PriceDistributionRow>(
            `SELECT
              CASE
                WHEN cost < 5 THEN 'Under $5'
                WHEN cost >= 5 AND cost < 7 THEN '$5 - $6.99'
                ELSE '$7 and above'
              END AS bucket,
              COUNT(*)::int AS item_count
            FROM menu
            GROUP BY 1
            ORDER BY 1 ASC;`
          ),
        ]);

      const summary = summaryResult.rows[0] ?? {
        total_orders: '0',
        total_revenue: '0',
        average_order_value: '0',
        pending_orders: '0',
      };

      return NextResponse.json({
        summary: {
          totalOrders: Number(summary.total_orders),
          totalRevenue: Number(summary.total_revenue),
          averageOrderValue: Number(summary.average_order_value),
          pendingOrders: Number(summary.pending_orders),
        },
        dailyTrend: dailyTrendResult.rows.map((row) => ({
          day: row.day,
          revenue: Number(row.revenue),
          orders: Number(row.orders),
        })),
        topSellers: topSellersResult,
        hourlyTrend: hourlyTrendResult.rows.map((row) => ({
          hourOfDay: Number(row.hour_of_day),
          orders: Number(row.orders),
        })),
        priceDistribution: distributionResult.rows.map((row) => ({
          label: row.bucket,
          count: Number(row.item_count),
        })),
        period: {
          startDate,
          endDate,
        },
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to build manager analytics:', error);
      return NextResponse.json(
        { error: 'Failed to load manager analytics' },
        { status: 500 }
      );
    } finally {
      client.release();
    }
  });
}
