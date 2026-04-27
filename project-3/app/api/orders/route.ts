import { NextRequest, NextResponse } from 'next/server';
import { createOrder, OrderAvailabilityError } from '@/lib/order';
import { withAuth } from '@/lib/middleware-utils';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, costTotal, employeeID, items, userId } = body;
    const order = await createOrder(
      customerName,
      costTotal,
      employeeID,
      items,
      userId ?? undefined   // undefined = guest, earnPoints skipped
    );
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    if (error instanceof OrderAvailabilityError) {
      return NextResponse.json(
        {
          error: 'Unable to place order because one or more ingredients are unavailable.',
          unavailableItems: error.unavailableItems,
        },
        { status: 409 }
      );
    }

    console.error('Failed to create order:', error);
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['employee', 'manager'], async () => {
    return NextResponse.json({ message: "GET request received" });
  });
}
