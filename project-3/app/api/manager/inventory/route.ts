import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware-utils';
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
  updateInventoryItem,
} from '@/lib/inventory';

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async () => {
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
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const name = String(body.name ?? '').trim();
      const cost = Number(body.cost);
      const inventoryNum = Number(body.inventoryNum);

      if (!name) {
        return NextResponse.json(
          { error: 'Item name is required.' },
          { status: 400 }
        );
      }

      if (!Number.isFinite(cost) || !Number.isFinite(inventoryNum)) {
        return NextResponse.json(
          { error: 'Cost and stock are required.' },
          { status: 400 }
        );
      }

      if (cost < 0 || inventoryNum < 0) {
        return NextResponse.json(
          { error: 'Cost and stock must be zero or greater.' },
          { status: 400 }
        );
      }

      const createdItem = await createInventoryItem(
        name,
        cost,
        Math.floor(inventoryNum),
        0
      );

      return NextResponse.json(createdItem, { status: 201 });
    } catch (error) {
      console.error('Inventory create error:', error);
      return NextResponse.json(
        { error: 'Failed to create inventory item.' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const inventoryId = Number(body.inventoryId);
      const name = String(body.name ?? '').trim();
      const cost = Number(body.cost);
      const inventoryNum = Number(body.inventoryNum);

      if (
        !Number.isFinite(inventoryId) ||
        !name ||
        !Number.isFinite(cost) ||
        !Number.isFinite(inventoryNum)
      ) {
        return NextResponse.json(
          { error: 'Inventory ID, name, cost, and stock are required.' },
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
        name,
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
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const inventoryId = Number(body.inventoryId);

      if (!Number.isFinite(inventoryId)) {
        return NextResponse.json(
          { error: 'Inventory ID is required.' },
          { status: 400 }
        );
      }

      const result = await deleteInventoryItem(inventoryId);

      if (result.inUse) {
        return NextResponse.json(
          {
            error:
              'This inventory item is used by one or more menu items and cannot be deleted.',
          },
          { status: 409 }
        );
      }

      if (!result.deleted) {
        return NextResponse.json(
          { error: 'Inventory item not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ deleted: true, inventoryId });
    } catch (error) {
      console.error('Inventory delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete inventory item.' },
        { status: 500 }
      );
    }
  });
}
