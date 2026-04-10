import { NextResponse } from 'next/server';
import { createOrder } from '@/lib/order';

export async function POST(request: Request) 
{
  try 
  {
    const body = await request.json();
    const { customerName, costTotal, employeeID, items } = body;
    const order = await createOrder(customerName, costTotal, employeeID, items);
    return NextResponse.json(order, { status: 201 });
  }
  catch (error)  {
    console.error('Failed to create order:', error);
    return NextResponse.json(
      { error: 'Failed to create order.' },
      { status: 500 }
    );
  }
}

export async function GET() {
    return NextResponse.json({ message: "GET request received" });
    }
