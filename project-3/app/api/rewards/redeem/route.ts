import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import { getPointsBalance, redeemPoints } from '@/lib/rewards';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const user = verifyToken(token ?? '');

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const client = await pool.connect();
    try 
    {
        await client.query('BEGIN');
        await redeemPoints(client, user.userId);
        await client.query('COMMIT');

        const points = await getPointsBalance(user.userId);
        return NextResponse.json({ points });
  } catch (error) {
    console.error('Rewards fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  } finally {
    client.release();
  }
}