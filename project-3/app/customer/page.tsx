'use client';

import { useEffect, useState } from 'react';

type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');

        if (!response.ok) {
          throw new Error('Failed to load menu items.');
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
              : 'Failed to load menu items.';
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

  return (
    <main className="min-h-screen bg-[linear-gradient(160deg,#f7efe1_0%,#fffaf3_42%,#dcefe4_100%)] px-6 py-16 text-[#2f241d]">
      <section className="mx-auto w-full max-w-3xl rounded-[32px] border border-[#d4c2ad] bg-white/90 p-8 shadow-[0_24px_80px_rgba(79,55,33,0.14)] backdrop-blur sm:p-10">
        <div className="flex flex-col gap-4 border-b border-[#eadfce] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8a6240]">
              Team Matcha
            </p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
              Customer View
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6f5848] sm:text-base">
              Fresh drinks and cafe favorites, served in a simple menu view.
            </p>
          </div>
        </div>

        <div className="mt-8">
          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-[#d7c6b2] bg-[#fcf7f0] px-6 py-12 text-center text-[#7b6655]">
              Loading menu...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-[24px] border border-[#e7c0b8] bg-[#fff4f1] px-6 py-12 text-center text-[#8b4a3a]">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#d7c6b2] bg-[#fcf7f0] px-6 py-12 text-center text-[#7b6655]">
              No menu items are available right now.
            </div>
          ) : null}

          {!isLoading && !error && items.length > 0 ? (
            <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#fffdf9]">
              <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#eadfce] bg-[#f8f1e7] px-6 py-4 text-xs font-bold uppercase tracking-[0.24em] text-[#8a6240] sm:px-8">
                <span>Item</span>
                <span>Price</span>
              </div>

              <div className="divide-y divide-[#f0e6d8]">
                {items.map((item) => (
                  <div
                    key={item.menuid}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-6 py-5 sm:px-8"
                  >
                    <div>
                      <p className="text-lg font-semibold text-[#2f241d]">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-base font-semibold text-[#2f7a5f]">
                      {currencyFormatter.format(item.cost)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
