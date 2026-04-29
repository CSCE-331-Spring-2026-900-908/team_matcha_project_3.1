import { NextRequest, NextResponse } from 'next/server';

import {
  createMenuCategory,
  deleteMenuCategory,
  getMenuCategories,
  updateMenuCategory,
} from '@/lib/manager-menu';
import { withAuth } from '@/lib/middleware-utils';

function parseCategoryId(value: unknown) {
  const categoryId = Number(value);
  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
}

function parseCategoryInput(body: Record<string, unknown>) {
  const name = String(body.name ?? '').trim();
  const color = String(body.color ?? '#667463').trim() || '#667463';
  const isActive =
    typeof body.isActive === 'boolean' ? body.isActive : true;

  if (!name) {
    return null;
  }

  return {
    name,
    color,
    isActive,
  };
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('includeInactive') === 'true';
      return NextResponse.json(await getMenuCategories(includeInactive));
    } catch (error) {
      console.error('Menu category fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch menu categories.' },
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
      const color = String(body.color ?? '#667463').trim() || '#667463';

      if (!name) {
        return NextResponse.json(
          { error: 'Category name is required.' },
          { status: 400 }
        );
      }

      return NextResponse.json(await createMenuCategory({ name, color }), {
        status: 201,
      });
    } catch (error) {
      console.error('Menu category create error:', error);
      return NextResponse.json(
        { error: 'Failed to create menu category.' },
        { status: 500 }
      );
    }
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const categoryId = parseCategoryId(body.categoryId);
      const input = parseCategoryInput(body);

      if (!categoryId || !input) {
        return NextResponse.json(
          { error: 'Category ID and name are required.' },
          { status: 400 }
        );
      }

      const category = await updateMenuCategory(categoryId, input);

      if (!category) {
        return NextResponse.json(
          { error: 'Menu category not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(category);
    } catch (error) {
      console.error('Menu category update error:', error);
      return NextResponse.json(
        { error: 'Failed to update menu category.' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const categoryId = parseCategoryId(body.categoryId);

      if (!categoryId) {
        return NextResponse.json(
          { error: 'Category ID is required.' },
          { status: 400 }
        );
      }

      const result = await deleteMenuCategory(categoryId);

      if (!result.deleted && !result.category) {
        return NextResponse.json(
          { error: 'Menu category not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(result);
    } catch (error) {
      console.error('Menu category delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete menu category.' },
        { status: 500 }
      );
    }
  });
}
