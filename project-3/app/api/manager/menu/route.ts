import { NextRequest, NextResponse } from 'next/server';

import {
  createMenuItem,
  deleteOrArchiveMenuItem,
  getManagerMenuItems,
  updateMenuItem,
  type MenuItemInput,
} from '@/lib/manager-menu';
import { withAuth } from '@/lib/middleware-utils';

function parseMenuId(value: unknown) {
  const menuId = Number(value);
  return Number.isInteger(menuId) && menuId > 0 ? menuId : null;
}

function parseMenuInput(body: Record<string, unknown>): MenuItemInput | null {
  const name = String(body.name ?? '').trim();
  const cost = Number(body.cost);
  const imageUrl = String(body.imageUrl ?? '').trim() || null;
  const categoryId =
    body.categoryId === null || body.categoryId === undefined
      ? null
      : Number(body.categoryId);
  const recipe = Array.isArray(body.recipe) ? body.recipe : [];

  if (
    !name ||
    !Number.isFinite(cost) ||
    cost < 0 ||
    (categoryId !== null && !Number.isFinite(categoryId))
  ) {
    return null;
  }

  return {
    name,
    cost,
    imageUrl,
    categoryId,
    recipe: recipe
      .map((row) => {
        const record = row as Record<string, unknown>;
        return {
          inventoryId: Number(record.inventoryId),
          itemQuantity: Number(record.itemQuantity),
        };
      })
      .filter(
        (row) =>
          Number.isInteger(row.inventoryId) &&
          row.inventoryId > 0 &&
          Number.isFinite(row.itemQuantity) &&
          row.itemQuantity > 0
      ),
  };
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeArchived = searchParams.get('includeArchived') === 'true';
      return NextResponse.json(await getManagerMenuItems(includeArchived));
    } catch (error) {
      console.error('Manager menu fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menu items.' },
        { status: 500 }
      );
    }
  });
}

export async function POST(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const input = parseMenuInput(body);

      if (!input) {
        return NextResponse.json(
          { error: 'Name, price, category, and recipe are required.' },
          { status: 400 }
        );
      }

      const item = await createMenuItem(input);
      return NextResponse.json(item, { status: 201 });
    } catch (error) {
      console.error('Manager menu create error:', error);
      return NextResponse.json(
        { error: 'Failed to create menu item.' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const menuId = parseMenuId(body.menuId);
      const input = parseMenuInput(body);

      if (!menuId || !input) {
        return NextResponse.json(
          { error: 'Menu ID, name, price, category, and recipe are required.' },
          { status: 400 }
        );
      }

      const item = await updateMenuItem(menuId, input);

      if (!item) {
        return NextResponse.json(
          { error: 'Menu item not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(item);
    } catch (error) {
      console.error('Manager menu update error:', error);
      return NextResponse.json(
        { error: 'Failed to update menu item.' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const menuId = parseMenuId(body.menuId);

      if (!menuId) {
        return NextResponse.json(
          { error: 'Menu ID is required.' },
          { status: 400 }
        );
      }

      const result = await deleteOrArchiveMenuItem(menuId);

      if (!result.deleted && !result.archived) {
        return NextResponse.json(
          { error: 'Menu item not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ ...result, menuId });
    } catch (error) {
      console.error('Manager menu delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete menu item.' },
        { status: 500 }
      );
    }
  });
}
