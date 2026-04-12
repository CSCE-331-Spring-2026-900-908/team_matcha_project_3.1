import { NextResponse } from 'next/server';

import { getInventoryItems } from '@/lib/inventory';

export async function GET() {
  try {
    const inventoryItems = await getInventoryItems();
    return NextResponse.json(inventoryItems);
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory data.' },
      { status: 500 }
    );
  }
}
