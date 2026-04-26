'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    <main className="min-h-screen bg-[linear-gradient(160deg,#f7efe1_0%,#fffaf3_42%,#dcefe4_100%)] px-6 py-16 text-[#1f2520]">
      <section id="main-content" className="mx-auto w-full max-w-3xl rounded-[32px] border border-[#d4c2ad] bg-white/90 p-8 shadow-[0_24px_80px_rgba(79,55,33,0.14)] backdrop-blur sm:p-10">
        <header className="flex flex-col gap-4 border-b border-[#eadfce] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="inline-flex items-center self-start rounded-full bg-[#f8f1e7] px-5 py-2 text-base font-bold text-[#4a554a] transition-all hover:bg-[#e6d8c4] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
              aria-label="Back to Portal"
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="mr-2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Portal
            </Link>
            <div>
              <p className="text-base font-bold uppercase tracking-[0.3em] text-[#4a554a]">
                Team Matcha
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl text-[#1f2520]">
                Menu
              </h1>
            </div>
          </div>
        </header>

        <div className="mt-10">
          {isLoading ? (
            <div className="rounded-[24px] border border-dashed border-[#d7c6b2] bg-[#fcf7f0] px-6 py-12 text-center text-[#4a554a] text-lg font-medium">
              Loading menu...
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="rounded-[24px] border border-[#e7c0b8] bg-[#fff4f1] px-6 py-12 text-center text-[#8b4a3a] text-lg font-medium">
              {error}
            </div>
          ) : null}

          {!isLoading && !error && items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#d7c6b2] bg-[#fcf7f0] px-6 py-12 text-center text-[#4a554a] text-lg font-medium">
              No menu items are available right now.
            </div>
          ) : null}

          {!isLoading && !error && items.length > 0 ? (
            <div className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-[#fffdf9]">
              <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-[#eadfce] bg-[#f8f1e7] px-8 py-5 text-sm font-bold uppercase tracking-[0.24em] text-[#4a554a]">
                <span>Item</span>
                <span>Price</span>
              </div>

              <div className="divide-y divide-[#f0e6d8]">
                {items.map((item) => (
                  <div
                    key={item.menuid}
                    className="grid grid-cols-[1fr_auto] items-center gap-4 px-8 py-6 transition-colors hover:bg-[#fcf7f0]"
                  >
                    <div>
                      <p className="text-xl font-bold text-[#1f2520]">
                        {item.name}
                      </p>
                    </div>
                    <p className="text-lg font-bold text-[#2f7a5f]">
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
