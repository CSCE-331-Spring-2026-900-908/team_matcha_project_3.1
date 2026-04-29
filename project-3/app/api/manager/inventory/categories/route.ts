import { NextRequest, NextResponse } from 'next/server';

import {
  createInventoryCategory,
  deleteInventoryCategory,
  getInventoryCategories,
  updateInventoryCategory,
} from '@/lib/inventory';
import { withAuth } from '@/lib/middleware-utils';

function parseCategoryId(value: unknown) {
  const categoryId = Number(value);
  return Number.isInteger(categoryId) && categoryId > 0 ? categoryId : null;
}

function parseCategoryInput(body: Record<string, unknown>) {
  const name = String(body.name ?? '').trim();
  const isActive =
    typeof body.isActive === 'boolean' ? body.isActive : true;

  if (!name) {
    return null;
  }

  return {
    name,
    isActive,
  };
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const includeInactive = searchParams.get('includeInactive') === 'true';
      return NextResponse.json(await getInventoryCategories(includeInactive));
    } catch (error) {
      console.error('Inventory category fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory categories.' },
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

      if (!name) {
        return NextResponse.json(
          { error: 'Category name is required.' },
          { status: 400 }
        );
      }

      return NextResponse.json(await createInventoryCategory({ name }), {
        status: 201,
      });
    } catch (error) {
      console.error('Inventory category create error:', error);
      return NextResponse.json(
        { error: 'Failed to create inventory category.' },
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

      const category = await updateInventoryCategory(categoryId, input);

      if (!category) {
        return NextResponse.json(
          { error: 'Inventory category not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(category);
    } catch (error) {
      console.error('Inventory category update error:', error);
      return NextResponse.json(
        { error: 'Failed to update inventory category.' },
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

      const result = await deleteInventoryCategory(categoryId);

      if (!result.deleted && !result.category) {
        return NextResponse.json(
          { error: 'Inventory category not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(result);
    } catch (error) {
      console.error('Inventory category delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete inventory category.' },
        { status: 500 }
      );
    }
  });
}
