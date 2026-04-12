'use client';

import { useEffect, useState } from 'react';

type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
  inventoryNum: number;
  useAverage: number;
  daysLeft: number | null;
  status: 'In Stock' | 'Low Soon' | 'Low Stock';
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const statusClasses: Record<InventoryItem['status'], string> = {
  'In Stock': 'border-[#cfe3cc] bg-[#eef8ec] text-[#2f6d2a]',
  'Low Soon': 'border-[#ead5a3] bg-[#fff7e2] text-[#8b671c]',
  'Low Stock': 'border-[#e7b8b2] bg-[#fff1ef] text-[#97463c]',
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInventory() {
      try {
        const response = await fetch('/api/manager/inventory');

        if (!response.ok) {
          throw new Error('Failed to load inventory data.');
        }

        const data: InventoryItem[] = await response.json();

        if (isMounted) {
          setItems(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          const message =
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load inventory data.';
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInventory();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="rounded-[32px] border border-[#cfd9ca] bg-[#f7faf5] p-6 shadow-[0_18px_50px_rgba(31,37,32,0.06)] sm:p-8">
      <div className="flex flex-col gap-6">
        <div className="border-b border-[#dbe4d6] pb-6">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#667463]">
              Inventory
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#223020] sm:text-4xl">
              Ingredient and stock overview
            </h2>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[24px] border border-dashed border-[#ccd7c7] bg-white px-6 py-12 text-center text-[#677564]">
            Loading inventory...
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-[24px] border border-[#e0b1aa] bg-[#fff2f0] px-6 py-12 text-center text-[#91463d]">
            {error}
          </div>
        ) : null}

        {!isLoading && !error && items.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#ccd7c7] bg-white px-6 py-12 text-center text-[#677564]">
            No inventory records are available right now.
          </div>
        ) : null}

        {!isLoading && !error && items.length > 0 ? (
          <div className="overflow-visible rounded-[28px] border border-[#d9e3d5] bg-white">
            <div className="hidden grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] gap-4 rounded-t-[28px] border-b border-[#dfe8da] bg-[#edf4ea] px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-[#6c7968] lg:grid">
              <span>Ingredient / Stock Item</span>
              <span>Cost</span>
              <span>Current Stock</span>
              <span>Avg. Use</span>
              <span className="group relative inline-flex items-center">
                <span className="cursor-help underline decoration-dotted underline-offset-4">
                  Approx. Days Left
                </span>
                <span className="pointer-events-none absolute left-0 top-full z-10 mt-2 hidden w-max max-w-52 rounded-[16px] border border-[#d8e2d3] bg-white px-3 py-3 text-left text-[0.68rem] font-medium normal-case tracking-normal text-[#586756] shadow-[0_14px_30px_rgba(31,37,32,0.10)] group-hover:block">
                  Current stock divided by average use.
                </span>
              </span>
              <span>Status</span>
            </div>

            <div className="divide-y divide-[#ebf0e8]">
              {items.map((item) => (
                <article
                  key={item.inventoryId}
                  className="grid gap-4 px-6 py-5 lg:grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] lg:items-center"
                >
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Ingredient / Stock Item
                    </p>
                    <p className="text-base font-semibold text-[#223020] sm:text-lg">
                      {item.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Cost
                    </p>
                    <p className="text-sm font-medium text-[#586756] sm:text-base">
                      {currencyFormatter.format(item.cost)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Current Stock
                    </p>
                    <p className="text-sm font-medium text-[#223020] sm:text-base">
                      {item.inventoryNum}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Avg. Use
                    </p>
                    <p className="text-sm font-medium text-[#586756] sm:text-base">
                      {item.useAverage}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Days Left
                    </p>
                    <p className="text-sm font-medium text-[#586756] sm:text-base">
                      {item.daysLeft ?? 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7a8777] lg:hidden">
                      Status
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${statusClasses[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
