import { NextResponse } from 'next/server';
import {
  getDefaultAnalyticsDateRange,
  getTopSellers,
  getTopSellersAllTime,
} from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { start, end } = getDefaultAnalyticsDateRange();
    const recentTopSellers = await getTopSellers(start, end, 1);
    const isRecentWindow = recentTopSellers.length > 0;
    const bestseller =
      recentTopSellers[0] ?? (await getTopSellersAllTime(1))[0] ?? null;

    return NextResponse.json({
      bestseller,
      source: isRecentWindow ? 'last-7-days' : 'all-time',
      period: {
        startDate: start,
        endDate: end,
      },
    });
  } catch (error) {
    console.error('Failed to fetch menu spotlight:', error);
    return NextResponse.json(
      { error: 'Failed to load bestseller spotlight' },
      { status: 500 }
    );
  }
}
