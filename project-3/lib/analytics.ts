import pool from '@/lib/db';

export type TopSeller = {
  menuid: number;
  name: string;
  unitsSold: number;
  salesAmount: number;
};

type TopSellerRow = {
  menuid: number;
  name: string;
  units_sold: string;
  sales_amount: string;
};

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDefaultAnalyticsDateRange() {
  const now = new Date();
  const end = toIsoDate(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 6);

  return {
    start: toIsoDate(startDate),
    end,
  };
}

export async function getTopSellers(startDate: string, endDate: string, limit = 5): Promise<TopSeller[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<TopSellerRow>(
      `SELECT
        oi.menuid,
        m.name,
        COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
        COALESCE(SUM(COALESCE(oi.cost, m.cost) * oi.quantity), 0)::numeric AS sales_amount
      FROM order_items oi
      JOIN orders o ON o.orderid = oi.orderid
      JOIN menu m ON m.menuid = oi.menuid
      WHERE o.orderdatetime >= $1::date
        AND o.orderdatetime < ($2::date + INTERVAL '1 day')
      GROUP BY oi.menuid, m.name
      ORDER BY units_sold DESC, sales_amount DESC
      LIMIT $3;`,
      [startDate, endDate, limit]
    );

    return result.rows.map((row) => ({
      menuid: row.menuid,
      name: row.name,
      unitsSold: Number(row.units_sold),
      salesAmount: Number(row.sales_amount),
    }));
  } finally {
    client.release();
  }
}

export async function getTopSellersAllTime(limit = 5): Promise<TopSeller[]> {
  const client = await pool.connect();

  try {
    const result = await client.query<TopSellerRow>(
      `SELECT
        oi.menuid,
        m.name,
        COALESCE(SUM(oi.quantity), 0)::int AS units_sold,
        COALESCE(SUM(COALESCE(oi.cost, m.cost) * oi.quantity), 0)::numeric AS sales_amount
      FROM order_items oi
      JOIN orders o ON o.orderid = oi.orderid
      JOIN menu m ON m.menuid = oi.menuid
      GROUP BY oi.menuid, m.name
      ORDER BY units_sold DESC, sales_amount DESC
      LIMIT $1;`,
      [limit]
    );

    return result.rows.map((row) => ({
      menuid: row.menuid,
      name: row.name,
      unitsSold: Number(row.units_sold),
      salesAmount: Number(row.sales_amount),
    }));
  } finally {
    client.release();
  }
}
