import { NextResponse } from 'next/server';

import { getInventoryItems, updateInventoryItem } from '@/lib/inventory';

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const inventoryId = Number(body.inventoryId);
    const cost = Number(body.cost);
    const inventoryNum = Number(body.inventoryNum);

    if (
      !Number.isFinite(inventoryId) ||
      !Number.isFinite(cost) ||
      !Number.isFinite(inventoryNum)
    ) {
      return NextResponse.json(
        { error: 'Inventory ID, cost, and stock are required.' },
        { status: 400 }
      );
    }

    if (cost < 0 || inventoryNum < 0) {
      return NextResponse.json(
        { error: 'Cost and stock must be zero or greater.' },
        { status: 400 }
      );
    }

    const updatedItem = await updateInventoryItem(
      inventoryId,
      cost,
      Math.floor(inventoryNum)
    );

    if (!updatedItem) {
      return NextResponse.json(
        { error: 'Inventory item not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    console.error('Inventory update error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item.' },
      { status: 500 }
    );
  }
}
