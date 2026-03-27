import { NextResponse } from 'next/server';
import pool from '@/lib/db'; 

export async function GET() {
  try {
    const client = await pool.connect();
    // Querying your Project 2 menu table
    const result = await client.query('SELECT * FROM menu LIMIT 10;'); 
    client.release();
    
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}