import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const client = await pool.connect();

    const result = await client.query(
      'SELECT menuid, name, cost FROM menu ORDER BY name ASC;'
    );

    client.release();

    const menuItems = result.rows.map((row) => ({
      menuid: row.menuid,
      name: row.name,
      cost: Number(row.cost),
    }));

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
