'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
};

type InventoryItem = {
  inventoryId: number;
  name: string;
  cost: number;
};

type CategoryKey = 'milkTeas' | 'fruitTeas' | 'greenOolong';

const categoryConfig: {
  key: CategoryKey;
  title: string;
  color: string;
}[] = [
  { key: 'milkTeas', title: 'Milk Teas', color: '#c95d70' },
  { key: 'fruitTeas', title: 'Fruit Teas', color: '#d79b28' },
  { key: 'greenOolong', title: 'Green & Oolong', color: '#3f8a5a' },
];

const sweetnessLevels = ['0%', '25%', '50%', '75%', '100%', '125%'];
const iceLevels = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const toppingKeywords = ['tapioca', 'boba', 'red bean', 'honey'];

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function categorizeItem(name: string): CategoryKey | null {
  if (name.includes('Green Tea') || name.includes('Oolong')) {
    return 'greenOolong';
  }

  if (name.includes('Fruit Tea')) {
    return 'fruitTeas';
  }

  if (name.includes('Milk Tea')) {
    return 'milkTeas';
  }

  return null;
}

function isToppingItem(item: InventoryItem) {
  const normalized = item.name.toLowerCase();
  return toppingKeywords.some((keyword) => normalized.includes(keyword));
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [toppings, setToppings] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [toppingError, setToppingError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMenuBoardData() {
      setIsLoading(true);
      setMenuError(null);
      setToppingError(null);

      try {
        const menuResponse = await fetch('/api/menu');

        if (!menuResponse.ok) {
          throw new Error('Failed to load menu items.');
        }

        const menuData = (await menuResponse.json()) as MenuItem[];

        if (isMounted) {
          setItems(menuData);
        }
      } catch (fetchError) {
        if (isMounted) {
          setMenuError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Failed to load menu items.'
          );
        }
      }

      try {
        const token =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('auth_token')
            : null;
        const headers = new Headers();

        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }

        const inventoryResponse = await fetch('/api/manager/inventory', {
          headers,
        });

        if (!inventoryResponse.ok) {
          throw new Error('Toppings unavailable.');
        }

        const inventoryData = (await inventoryResponse.json()) as InventoryItem[];

        if (isMounted) {
          setToppings(inventoryData.filter(isToppingItem));
        }
      } catch (fetchError) {
        if (isMounted) {
          setToppingError(
            fetchError instanceof Error
              ? fetchError.message
              : 'Toppings unavailable.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadMenuBoardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedItems = useMemo(() => {
    return items.reduce<Record<CategoryKey, MenuItem[]>>(
      (groups, item) => {
        const category = categorizeItem(item.name);

        if (category) {
          groups[category].push(item);
        }

        return groups;
      },
      { milkTeas: [], fruitTeas: [], greenOolong: [] }
    );
  }, [items]);

  const toppingText =
    toppings.length > 0
      ? toppings
          .map((topping) => `${topping.name} (${currencyFormatter.format(topping.cost)})`)
          .join(' • ')
      : toppingError ?? 'Loading toppings...';

  return (
    <main className="h-dvh overflow-hidden bg-[#f2efe6] p-2 text-[#28251f] sm:p-3">
      <section
        id="main-content"
        className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden border border-[#d8d1c5] bg-[#fffdf8] shadow-[0_16px_40px_rgba(40,34,25,0.12)]"
      >
        <header className="flex min-h-0 items-start justify-between gap-3 border-b-2 border-[#37332c] px-3 py-2 sm:px-5">
          <div className="min-w-0">
            <p className="font-serif text-[0.58rem] font-bold uppercase tracking-[0.28em] text-[#6b6458] sm:text-xs">
              Team Matcha
            </p>
            <h1 className="truncate font-serif text-[1.85rem] font-black uppercase leading-none tracking-normal text-[#25211d] sm:text-[2.55rem] lg:text-[3.2rem]">
              Bubble Tea Menu
            </h1>
          </div>

          <Link
            href="/"
            className="shrink-0 border border-[#37332c] bg-[#fffdf8] px-2 py-1 text-[0.62rem] font-bold uppercase tracking-[0.08em] text-[#37332c] hover:bg-[#ece7dc] focus:outline-none focus:ring-2 focus:ring-[#3f8a5a] sm:px-3 sm:text-xs"
            aria-label="Back to Portal"
          >
            Portal
          </Link>
        </header>

        <div className="min-h-0 overflow-hidden px-2 py-2 sm:px-3 lg:px-4">
          {isLoading ? (
            <div className="grid h-full place-items-center font-serif text-lg font-bold uppercase tracking-[0.16em] text-[#6b6458]">
              Loading menu...
            </div>
          ) : menuError ? (
            <div className="grid h-full place-items-center px-4 text-center font-serif text-lg font-bold text-[#8b3f39]">
              {menuError}
            </div>
          ) : (
            <div className="grid h-full min-h-0 grid-cols-1 gap-2 overflow-hidden portrait:grid-cols-[1.35fr_1fr] landscape:grid-cols-3 sm:gap-3 lg:grid-cols-3">
              {categoryConfig.map((category) => {
                const categoryItems = groupedItems[category.key];

                return (
                  <section
                    key={category.key}
                    className={`grid min-h-0 grid-rows-[auto_1fr] overflow-hidden ${
                      category.key === 'greenOolong' ? 'portrait:col-start-2' : ''
                    } ${category.key === 'milkTeas' ? 'portrait:row-span-2' : ''}`}
                  >
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2 border-b border-[#454039] pb-1"
                      style={{ color: category.color }}
                    >
                      <h2 className="truncate font-serif text-[1rem] font-black uppercase leading-none tracking-normal sm:text-[1.4rem] lg:text-[1.8rem]">
                        {category.title}
                      </h2>
                      <span className="text-[0.52rem] font-black uppercase tracking-[0.08em] text-[#777064] sm:text-[0.65rem]">
                        Price
                      </span>
                    </div>

                    <ol className="grid min-h-0 auto-rows-min content-start gap-1.5 overflow-hidden pt-1 sm:gap-2">
                      {categoryItems.map((item, index) => (
                        <li
                          key={item.menuid}
                          className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2"
                        >
                          <span className="grid size-4 shrink-0 place-items-center rounded-full border border-[#9c968c] font-serif text-[0.5rem] font-bold leading-none text-[#686158] sm:size-5 sm:text-[0.62rem]">
                            {index + 1}
                          </span>
                          <div className="flex min-w-0 items-center gap-1">
                            <span className="min-w-0 truncate text-[0.73rem] font-bold leading-tight text-[#302c27] sm:text-[0.95rem] lg:text-[1.06rem]">
                              {item.name}
                            </span>
                            <span
                              className="h-px min-w-3 flex-1 border-t border-dotted"
                              style={{ borderColor: category.color }}
                              aria-hidden="true"
                            />
                          </div>
                          <span className="font-serif text-[0.72rem] font-black leading-none text-[#27231f] sm:text-[0.9rem] lg:text-[1rem]">
                            {priceFormatter.format(item.cost)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
          )}
        </div>

        <footer className="grid min-h-0 grid-cols-1 gap-1 border-t border-[#d5cec2] bg-[#ebe7df] px-3 py-2 text-[#302c27] landscape:grid-cols-[1.25fr_1fr_1fr] sm:grid-cols-3 sm:gap-3 sm:px-5">
          <section className="grid grid-cols-[auto_1fr] gap-2 sm:block">
            <h3 className="whitespace-nowrap font-serif text-[0.62rem] font-black uppercase tracking-[0.12em] sm:mb-1 sm:text-[0.78rem]">
              Toppings
            </h3>
            <p className="truncate text-[0.62rem] font-semibold leading-tight sm:text-[0.78rem] lg:text-[0.9rem]">
              {toppingText}
            </p>
          </section>
          <section className="grid grid-cols-[auto_1fr] gap-2 sm:block">
            <h3 className="whitespace-nowrap font-serif text-[0.62rem] font-black uppercase tracking-[0.12em] sm:mb-1 sm:text-[0.78rem]">
              Sweetness Levels
            </h3>
            <p className="truncate text-[0.62rem] font-semibold leading-tight sm:text-[0.78rem] lg:text-[0.9rem]">
              {sweetnessLevels.join(' • ')}
            </p>
          </section>
          <section className="grid grid-cols-[auto_1fr] gap-2 sm:block">
            <h3 className="whitespace-nowrap font-serif text-[0.62rem] font-black uppercase tracking-[0.12em] sm:mb-1 sm:text-[0.78rem]">
              Ice Levels
            </h3>
            <p className="truncate text-[0.62rem] font-semibold leading-tight sm:text-[0.78rem] lg:text-[0.9rem]">
              {iceLevels.join(' • ')}
            </p>
          </section>
        </footer>
      </section>
    </main>
  );
}
