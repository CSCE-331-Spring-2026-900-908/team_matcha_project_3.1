import pool from '@/lib/db';

export type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
  image_url?: string;
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT menuid, name, cost, image_url FROM menu ORDER BY name ASC;'
    );
    return result.rows.map((row) => ({
      menuid: row.menuid,
      name: row.name,
      cost: Number(row.cost),
      image_url: row.image_url,
    }));
  } finally {
    client.release();
  }
}