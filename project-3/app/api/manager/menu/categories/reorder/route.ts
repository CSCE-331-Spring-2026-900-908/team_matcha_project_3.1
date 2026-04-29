import { NextRequest, NextResponse } from 'next/server';

import { reorderMenuCategories } from '@/lib/manager-menu';
import { withAuth } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const categoryIds = Array.isArray(body.categoryIds)
        ? body.categoryIds
            .map((value: unknown) => Number(value))
            .filter((value: number) => Number.isInteger(value) && value > 0)
        : [];

      if (categoryIds.length === 0) {
        return NextResponse.json(
          { error: 'Category order is required.' },
          { status: 400 }
        );
      }

      return NextResponse.json(await reorderMenuCategories(categoryIds));
    } catch (error) {
      console.error('Menu category reorder error:', error);
      return NextResponse.json(
        { error: 'Failed to reorder menu categories.' },
        { status: 500 }
      );
    }
  });
}
