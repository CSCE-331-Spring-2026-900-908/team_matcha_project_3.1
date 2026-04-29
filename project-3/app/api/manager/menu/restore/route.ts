import { NextRequest, NextResponse } from 'next/server';

import { restoreMenuItem } from '@/lib/manager-menu';
import { withAuth } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  return withAuth(req, ['manager'], async (request) => {
    try {
      const body = await request.json();
      const menuId = Number(body.menuId);

      if (!Number.isInteger(menuId) || menuId <= 0) {
        return NextResponse.json(
          { error: 'Menu ID is required.' },
          { status: 400 }
        );
      }

      const restored = await restoreMenuItem(menuId);

      if (!restored) {
        return NextResponse.json(
          { error: 'Menu item not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ restored: true, menuId });
    } catch (error) {
      console.error('Manager menu restore error:', error);
      return NextResponse.json(
        { error: 'Failed to restore menu item.' },
        { status: 500 }
      );
    }
  });
}
