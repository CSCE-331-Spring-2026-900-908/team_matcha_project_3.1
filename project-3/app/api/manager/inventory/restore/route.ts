import { NextRequest, NextResponse } from 'next/server';

import { restoreInventoryItem } from '@/lib/inventory';
import { withAuth } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
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

      const restored = await restoreInventoryItem(inventoryId);

      if (!restored) {
        return NextResponse.json(
          { error: 'Inventory item not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json({ restored: true, inventoryId });
    } catch (error) {
      console.error('Inventory restore error:', error);
      return NextResponse.json(
        { error: 'Failed to restore inventory item.' },
        { status: 500 }
      );
    }
  });
}
