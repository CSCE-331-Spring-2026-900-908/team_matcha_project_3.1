import { NextResponse } from 'next/server';
import pool from '@/lib/db';

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

type TopSellerRow = {
  menuid: number;
  name: string;
  units_sold: string;
  sales_amount: string;
};

type HourlyTrendRow = {
  hour_of_day: string;
  orders: string;
};

type PriceDistributionRow = {
  bucket: string;
  item_count: string;
};

export async function GET() {
  const client = await pool.connect();

  try {
    const [summaryResult, dailyTrendResult, topSellersResult, hourlyTrendResult, distributionResult] =
      await Promise.all([
        client.query<SummaryRow>(
          `SELECT
            COUNT(*)::int AS total_orders,
            COALESCE(SUM(costtotal), 0)::numeric AS total_revenue,
            COALESCE(AVG(costtotal), 0)::numeric AS average_order_value,
            COUNT(*) FILTER (WHERE LOWER(COALESCE(status, '')) IN ('pending', 'in progress', 'preparing'))::int AS pending_orders
          FROM orders
          WHERE orderdatetime >= NOW() - INTERVAL '7 days';`
        ),
        client.query<DailyTrendRow>(
          `SELECT
            TO_CHAR(DATE(orderdatetime), 'YYYY-MM-DD') AS day,
            COALESCE(SUM(costtotal), 0)::numeric AS revenue,
            COUNT(*)::int AS orders
          FROM orders
          WHERE orderdatetime >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(orderdatetime)
          ORDER BY DATE(orderdatetime) ASC;`
        ),
        client.query<TopSellerRow>(
          `SELECT
            oi.menuid,
            m.name,
            COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
            COALESCE(SUM(COALESCE(oi.cost, m.cost) * oi.quantity), 0)::numeric AS sales_amount
          FROM order_items oi
          JOIN orders o ON o.orderid = oi.orderid
          JOIN menu m ON m.menuid = oi.menuid
          WHERE o.orderdatetime >= NOW() - INTERVAL '7 days'
          GROUP BY oi.menuid, m.name
          ORDER BY units_sold DESC, sales_amount DESC
          LIMIT 5;`
        ),
        client.query<HourlyTrendRow>(
          `SELECT
            EXTRACT(HOUR FROM orderdatetime)::int AS hour_of_day,
            COUNT(*)::int AS orders
          FROM orders
          WHERE DATE(orderdatetime) = CURRENT_DATE
          GROUP BY EXTRACT(HOUR FROM orderdatetime)
          ORDER BY hour_of_day ASC;`
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
      topSellers: topSellersResult.rows.map((row) => ({
        menuid: row.menuid,
        name: row.name,
        unitsSold: Number(row.units_sold),
        salesAmount: Number(row.sales_amount),
      })),
      hourlyTrend: hourlyTrendResult.rows.map((row) => ({
        hourOfDay: Number(row.hour_of_day),
        orders: Number(row.orders),
      })),
      priceDistribution: distributionResult.rows.map((row) => ({
        label: row.bucket,
        count: Number(row.item_count),
      })),
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
}
