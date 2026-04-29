import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware-utils';
import {
  createInventoryItem,
  deleteInventoryItem,
  getInventoryItems,
  updateInventoryItem,
} from '@/lib/inventory';

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeArchived = searchParams.get('includeArchived') === 'true';
      const inventoryItems = await getInventoryItems(includeArchived);
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
      const categoryId =
        body.categoryId === null || body.categoryId === undefined
          ? null
          : Number(body.categoryId);

      if (!name) {
        return NextResponse.json(
          { error: 'Item name is required.' },
          { status: 400 }
        );
      }

      if (
        !Number.isFinite(cost) ||
        !Number.isFinite(inventoryNum) ||
        (categoryId !== null && !Number.isFinite(categoryId))
      ) {
        return NextResponse.json(
          { error: 'Cost, stock, and category must be valid.' },
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
        0,
        categoryId
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
      const categoryId =
        body.categoryId === null || body.categoryId === undefined
          ? null
          : Number(body.categoryId);

      if (
        !Number.isFinite(inventoryId) ||
        !name ||
        !Number.isFinite(cost) ||
        !Number.isFinite(inventoryNum) ||
        (categoryId !== null && !Number.isFinite(categoryId))
      ) {
        return NextResponse.json(
          { error: 'Inventory ID, name, cost, stock, and category are required.' },
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
        Math.floor(inventoryNum),
        categoryId
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

      if (!result.deleted && !result.archived) {
        return NextResponse.json(
          { error: 'Inventory item not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        deleted: result.deleted,
        archived: result.archived,
        inventoryId,
      });
    } catch (error) {
      console.error('Inventory delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete inventory item.' },
        { status: 500 }
      );
    }
  });
}
