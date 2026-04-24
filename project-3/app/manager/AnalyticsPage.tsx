'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { authFetch } from '@/lib/fetch-utils';

type ManagerAnalytics = {
  summary: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
  };
  dailyTrend: {
    day: string;
    revenue: number;
    orders: number;
  }[];
  topSellers: {
    menuid: number;
    name: string;
    unitsSold: number;
    salesAmount: number;
  }[];
  hourlyTrend: {
    hourOfDay: number;
    orders: number;
  }[];
  priceDistribution: {
    label: string;
    count: number;
  }[];
  period: {
    startDate: string;
    endDate: string;
  };
  generatedAt: string;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDefaultDateRange() {
  const now = new Date();
  const endDate = toIsoDate(now);
  const startObj = new Date(now);
  startObj.setDate(startObj.getDate() - 6);

  return {
    startDate: toIsoDate(startObj),
    endDate,
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<ManagerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [appliedStartDate, setAppliedStartDate] = useState(defaultRange.startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(defaultRange.endDate);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAnalytics() {
      try {
        if (!isInitialLoadRef.current) {
          setIsRefreshing(true);
        }

        const params = new URLSearchParams({
          startDate: appliedStartDate,
          endDate: appliedEndDate,
        });
        const response = await authFetch(`/api/manager/analytics?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to load manager analytics.');
        }

        const data: ManagerAnalytics = await response.json();

        if (isMounted) {
          setAnalytics(data);
          setError(null);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load manager analytics.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsRefreshing(false);
          isInitialLoadRef.current = false;
        }
      }
    }

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [appliedStartDate, appliedEndDate]);

  function applyDateRange() {
    if (startDate > endDate) {
      setError('Start date must be before or equal to end date.');
      return;
    }

    setError(null);
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
  }

  const trendStats = useMemo(() => {
    if (!analytics) {
      return null;
    }

    const totalUnitsSold = analytics.topSellers.reduce(
      (sum, item) => sum + item.unitsSold,
      0
    );

    if (analytics.dailyTrend.length === 0) {
      return {
        minRevenue: 0,
        revenueRange: 1,
        totalUnitsSold,
      };
    }

    const minRevenue = Math.min(...analytics.dailyTrend.map((day) => day.revenue));
    const maxRevenue = Math.max(...analytics.dailyTrend.map((day) => day.revenue));

    return {
      minRevenue,
      revenueRange: Math.max(maxRevenue - minRevenue, 0.01),
      totalUnitsSold,
    };
  }, [analytics]);

  return (
    <section className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="border-b border-[#dbe4d6] pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
            Analytics
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
            Sales and trend dashboard
          </h2>
          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <label className="text-sm font-semibold text-[#556253]">
              Start date
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-2 block w-full rounded-[12px] border border-[#cfd9ca] bg-white px-4 py-3 text-base font-medium text-[#223020] outline-none focus:border-[#6a8e67] focus:ring-4 focus:ring-[#dbe7d7]"
              />
            </label>

            <label className="text-sm font-semibold text-[#556253]">
              End date
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-2 block w-full rounded-[12px] border border-[#cfd9ca] bg-white px-4 py-3 text-base font-medium text-[#223020] outline-none focus:border-[#6a8e67] focus:ring-4 focus:ring-[#dbe7d7]"
              />
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={applyDateRange}
                disabled={isLoading || isRefreshing}
                className="w-full rounded-[12px] border border-[#5f855c] bg-[#6a8e67] px-5 py-3 text-sm font-bold uppercase tracking-[0.16em] text-white transition hover:bg-[#597b56] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRefreshing ? 'Updating...' : 'Apply Range'}
              </button>
            </div>
          </div>
          <p className="mt-3 text-sm text-[#607061]">
            Showing insights for {appliedStartDate} through {appliedEndDate}.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-[24px] border border-dashed border-[#ccd7c7] bg-white px-6 py-12 text-center text-[#677564]">
            Loading analytics...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-[24px] border border-[#e0b1aa] bg-[#fff2f0] px-6 py-12 text-center text-[#91463d]">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && analytics && trendStats ? (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Orders (range)
                </p>
                <p className="mt-3 text-[clamp(1.6rem,4vw,2.25rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
                  {compactNumberFormatter.format(analytics.summary.totalOrders)}
                </p>
              </article>
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Revenue (range)
                </p>
                <p className="mt-3 text-[clamp(1.6rem,4vw,2.25rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere] sm:hidden">
                  {compactCurrencyFormatter.format(analytics.summary.totalRevenue)}
                </p>
                <p className="mt-3 hidden text-[clamp(1.6rem,4vw,2.25rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere] sm:block">
                  {currencyFormatter.format(analytics.summary.totalRevenue)}
                </p>
              </article>
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Avg Order Value
                </p>
                <p className="mt-3 text-[clamp(1.6rem,4vw,2.25rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere] sm:hidden">
                  {compactCurrencyFormatter.format(analytics.summary.averageOrderValue)}
                </p>
                <p className="mt-3 hidden text-[clamp(1.6rem,4vw,2.25rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere] sm:block">
                  {currencyFormatter.format(analytics.summary.averageOrderValue)}
                </p>
              </article>
              <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                  Pending Orders
                </p>
                <p className="mt-3 text-[clamp(1.6rem,4vw,2.25rem)] font-bold leading-tight tracking-tight [overflow-wrap:anywhere]">
                  {analytics.summary.pendingOrders}
                </p>
              </article>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                <h3 className="text-xl font-semibold">Revenue Trend</h3>
                <p className="mt-1 text-sm text-[#607061]">
                  Daily revenue movement for the selected period.
                </p>
                {analytics.dailyTrend.length > 0 ? (
                  <div className="mt-6 overflow-x-auto">
                    <div
                      className="grid min-w-[420px] items-end gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${analytics.dailyTrend.length}, minmax(24px, 1fr))`,
                      }}
                    >
                    {analytics.dailyTrend.map((day) => {
                      const normalizedHeight =
                        ((day.revenue - trendStats.minRevenue) / trendStats.revenueRange) *
                          90 +
                        12;

                      return (
                        <div key={day.day} className="flex flex-col items-center">
                          <div
                            className="w-full rounded-t-md bg-[#6e8f72]"
                            style={{ height: `${normalizedHeight}px` }}
                            title={`${day.day}: ${currencyFormatter.format(day.revenue)}`}
                          />
                          <span className="mt-2 text-[11px] font-semibold text-[#607061]">
                            {day.day.slice(5)}
                          </span>
                        </div>
                      );
                    })}
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-[#607061]">No recent trend data.</p>
                )}
              </article>

              <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                <h3 className="text-xl font-semibold">Top Sellers</h3>
                <p className="mt-1 text-sm text-[#607061]">
                  Best-selling menu items by quantity sold in this range.
                </p>
                <ul className="mt-5 divide-y divide-[#e4ece0]">
                  {analytics.topSellers.map((item) => (
                    <li
                      key={item.menuid}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <p className="text-xs text-[#607061]">
                          {percentageFormatter.format(
                            trendStats.totalUnitsSold > 0
                              ? item.unitsSold / trendStats.totalUnitsSold
                              : 0
                          )}{' '}
                          of item sales mix
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#2f7a5f]">
                          {item.unitsSold} sold
                        </p>
                        <p className="text-xs text-[#607061]">
                          {currencyFormatter.format(item.salesAmount)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                <h3 className="text-xl font-semibold">Orders by Hour</h3>
                <p className="mt-1 text-sm text-[#607061]">
                  Number of orders captured by hour in this date range.
                </p>
                <ul className="mt-5 max-h-56 space-y-2 overflow-auto pr-1">
                  {analytics.hourlyTrend.map((entry) => (
                    <li
                      key={entry.hourOfDay}
                      className="flex items-center justify-between rounded-[12px] border border-[#e4ece0] bg-[#fbfdfb] px-4 py-2"
                    >
                      <span className="text-sm font-medium">
                        {entry.hourOfDay.toString().padStart(2, '0')}:00
                      </span>
                      <span className="font-semibold text-[#2f7a5f]">
                        {entry.orders} orders
                      </span>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                <h3 className="text-xl font-semibold">Menu Price Distribution</h3>
                <p className="mt-1 text-sm text-[#607061]">
                  Catalog mix by price bracket.
                </p>
                <div className="mt-5 grid gap-3">
                  {analytics.priceDistribution.map((bucket) => (
                    <div
                      key={bucket.label}
                      className="rounded-[16px] border border-[#e4ece0] bg-[#fbfdfb] p-4"
                    >
                      <p className="text-sm font-semibold text-[#607061]">
                        {bucket.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold">{bucket.count}</p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <p className="text-xs text-[#607061]">
              Data window {analytics.period.startDate} to {analytics.period.endDate}.{' '}
              Last refreshed at {new Date(analytics.generatedAt).toLocaleString()}.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
