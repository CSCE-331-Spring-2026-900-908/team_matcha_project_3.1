import { NextResponse } from 'next/server';
import { getMenuItems } from '@/lib/menu';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const menuItems = await getMenuItems();

    return NextResponse.json(menuItems);
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
