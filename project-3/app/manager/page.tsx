'use client';

import { useEffect, useMemo, useState } from 'react';

type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

export default function ManagerPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');

        if (!response.ok) {
          throw new Error('Failed to load manager analytics.');
        }

        const data: MenuItem[] = await response.json();

        if (isMounted) {
          setItems(data);
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
        }
      }
    }

    loadMenu();

    return () => {
      isMounted = false;
    };
  }, []);

  const analytics = useMemo(() => {
    if (items.length === 0) {
      return null;
    }

    const totalItems = items.length;
    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
    const averageCost = totalCost / totalItems;

    const premiumThreshold = averageCost + 1;
    const valueThreshold = Math.max(0, averageCost - 1);

    const premiumItems = items.filter((item) => item.cost >= premiumThreshold);
    const valueItems = items.filter((item) => item.cost <= valueThreshold);

    const sortedByMenuId = [...items].sort((a, b) => a.menuid - b.menuid);
    const trendWindow = sortedByMenuId.slice(-8);
    const minTrendCost = Math.min(...trendWindow.map((item) => item.cost));
    const maxTrendCost = Math.max(...trendWindow.map((item) => item.cost));
    const trendRange = Math.max(maxTrendCost - minTrendCost, 0.01);

    const topPricedItems = [...items]
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    const underFive = items.filter((item) => item.cost < 5).length;
    const betweenFiveAndSeven = items.filter(
      (item) => item.cost >= 5 && item.cost < 7
    ).length;
    const overSeven = items.filter((item) => item.cost >= 7).length;

    return {
      totalItems,
      averageCost,
      premiumMix: premiumItems.length / totalItems,
      valueMix: valueItems.length / totalItems,
      trendWindow,
      minTrendCost,
      trendRange,
      topPricedItems,
      distribution: [
        { label: 'Under $5', count: underFive },
        { label: '$5 - $6.99', count: betweenFiveAndSeven },
        { label: '$7 and above', count: overSeven },
      ],
    };
  }, [items]);

  return (
    <main className="min-h-screen bg-[#eef1ec] px-6 py-10 text-[#1f2520]">
      <section className="mx-auto w-full max-w-6xl rounded-[28px] border border-[#c8d1c4] bg-[#f8faf7] p-8 shadow-[0_18px_48px_rgba(31,37,32,0.08)] sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5d6b5e]">
          Team Matcha POS
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          Manager Analytics
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#4c584d] sm:text-lg">
          Track pricing analytics and menu trends to guide promotions and product
          strategy.
        </p>

        <div className="mt-8">
          {isLoading ? (
            <div className="rounded-[22px] border border-dashed border-[#c7d2c3] bg-white px-6 py-12 text-center text-[#607061]">
              Loading analytics...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-[22px] border border-[#e4b7b7] bg-[#fff5f5] px-6 py-12 text-center text-[#8f4545]">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && analytics ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                    Menu Items
                  </p>
                  <p className="mt-3 text-3xl font-bold">{analytics.totalItems}</p>
                </article>
                <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                    Average Price
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {currencyFormatter.format(analytics.averageCost)}
                  </p>
                </article>
                <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                    Premium Mix
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {percentageFormatter.format(analytics.premiumMix)}
                  </p>
                </article>
                <article className="rounded-[20px] border border-[#d2dccc] bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#647462]">
                    Value Mix
                  </p>
                  <p className="mt-3 text-3xl font-bold">
                    {percentageFormatter.format(analytics.valueMix)}
                  </p>
                </article>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                  <h2 className="text-xl font-semibold">Recent Menu Cost Trend</h2>
                  <p className="mt-1 text-sm text-[#607061]">
                    Last 8 menu entries by ID, visualized by price.
                  </p>
                  <div className="mt-6 grid grid-cols-8 items-end gap-2">
                    {analytics.trendWindow.map((item) => {
                      const normalizedHeight =
                        ((item.cost - analytics.minTrendCost) / analytics.trendRange) *
                          88 +
                        12;

                      return (
                        <div key={item.menuid} className="flex flex-col items-center">
                          <div
                            className="w-full rounded-t-md bg-[#6e8f72]"
                            style={{ height: `${normalizedHeight}px` }}
                            title={`${item.name}: ${currencyFormatter.format(item.cost)}`}
                          />
                          <span className="mt-2 text-[11px] font-semibold text-[#607061]">
                            #{item.menuid}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </article>

                <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                  <h2 className="text-xl font-semibold">Top Priced Items</h2>
                  <p className="mt-1 text-sm text-[#607061]">
                    Highest priced items in the current catalog.
                  </p>
                  <ul className="mt-5 divide-y divide-[#e4ece0]">
                    {analytics.topPricedItems.map((item) => (
                      <li
                        key={item.menuid}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="font-semibold text-[#2f7a5f]">
                          {currencyFormatter.format(item.cost)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </article>
              </div>

              <article className="rounded-[22px] border border-[#d2dccc] bg-white p-6">
                <h2 className="text-xl font-semibold">Price Distribution</h2>
                <p className="mt-1 text-sm text-[#607061]">
                  Segment view to quickly spot menu mix balance.
                </p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {analytics.distribution.map((bucket) => (
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
          ) : null}

          {!isLoading && !error && !analytics ? (
            <div className="rounded-[22px] border border-dashed border-[#c7d2c3] bg-white px-6 py-12 text-center text-[#607061]">
              No menu data found, so analytics are unavailable.
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
