import pool from '@/lib/db';

export type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
};

export async function getMenuItems(): Promise<MenuItem[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT menuid, name, cost FROM menu ORDER BY name ASC;'
    );
    return result.rows.map((row) => ({
      menuid: row.menuid,
      name: row.name,
      cost: Number(row.cost),
    }));
  } finally {
    client.release();
  }
}