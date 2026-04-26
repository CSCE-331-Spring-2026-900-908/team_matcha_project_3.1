import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import { getPointsBalance } from '@/lib/rewards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const user = verifyToken(token ?? '');
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const points = await getPointsBalance(user.userId);
    return NextResponse.json({ points });

  } catch (error) {
    console.error('Rewards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}