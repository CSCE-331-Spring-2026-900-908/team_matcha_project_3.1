'use client';

import { useEffect, useMemo, useState } from 'react';
import { AVAILABLE_TOPPINGS, TOPPING_COSTS } from '@/lib/toppings';

type MenuItem = {
  menuid: number;
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
const addOnOptions = AVAILABLE_TOPPINGS.map((name) => ({
  name,
  cost: TOPPING_COSTS[name],
}));

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

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMenuBoardData() {
      setIsLoading(true);
      setMenuError(null);

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

  function renderCategory(category: (typeof categoryConfig)[number]) {
    const categoryItems = groupedItems[category.key];

    return (
      <section className="grid min-h-0 grid-rows-[auto_1fr] overflow-hidden">
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[0.5vw] border-b-[0.12vw] border-[#454039] pb-[0.3vw]"
          style={{ color: category.color }}
        >
          <h2 className="menu-board-category-title truncate font-serif text-[1.85vw] font-black uppercase leading-none tracking-[0.01em]">
            {category.title}
          </h2>
          <span className="menu-board-price-label text-[0.8vw] font-black uppercase tracking-[0.08em] text-[#777064]">
            Price
          </span>
        </div>

        <ol className="grid min-h-0 auto-rows-min content-start gap-[0.42vw] overflow-hidden pt-[0.5vw]">
          {categoryItems.map((item, index) => (
            <li
              key={item.menuid}
              className="grid min-w-0 grid-cols-[1.7vw_minmax(0,1fr)_auto] items-center gap-[0.45vw]"
            >
              <span className="menu-board-index grid h-[1.7vw] w-[1.7vw] shrink-0 place-items-center rounded-full border border-[#9c968c] font-serif text-[0.76vw] font-bold leading-none text-[#686158]">
                {index + 1}
              </span>
              <div className="flex min-w-0 items-center gap-[0.45vw]">
                <span className="menu-board-item-name min-w-0 truncate text-[1.24vw] font-bold leading-tight text-[#302c27]">
                  {item.name}
                </span>
                <span
                  className="h-px min-w-[0.65vw] flex-1 border-t-[0.12vw] border-dotted"
                  style={{ borderColor: category.color }}
                  aria-hidden="true"
                />
              </div>
              <span className="menu-board-item-price font-serif text-[1.24vw] font-black leading-none text-[#27231f]">
                {priceFormatter.format(item.cost)}
              </span>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#1d4738]">
      <section
        id="main-content"
        className="menu-board grid h-full w-full min-h-0 grid-rows-[13%_1fr_18%] overflow-hidden border-[0.24vw] border-[#d8d1c5] bg-[#fffdf8] text-[#28251f] shadow-[0_1vw_3.3vw_rgba(16,24,20,0.28)]"
        aria-label="Bubble tea menu board display"
      >
          <header className="flex min-h-0 items-start border-b-[0.2vw] border-[#37332c] px-[2.5vw] py-[1.2vw]">
            <div className="min-w-0">
              <p className="menu-board-eyebrow font-serif text-[0.92vw] font-bold uppercase tracking-[0.24em] text-[#6b6458]">
                Team Matcha
              </p>
              <h1 className="menu-board-title truncate font-serif text-[3.15vw] font-black uppercase leading-none tracking-normal text-[#25211d]">
                Bubble Tea Menu
              </h1>
            </div>
          </header>

          <div className="min-h-0 overflow-hidden px-[1.8vw] py-[1vw]">
            {isLoading ? (
              <div className="menu-board-status grid h-full place-items-center font-serif text-[1.45vw] font-bold uppercase tracking-[0.16em] text-[#6b6458]">
                Loading menu...
              </div>
            ) : menuError ? (
              <div className="menu-board-status grid h-full place-items-center px-[2vw] text-center font-serif text-[1.4vw] font-bold text-[#8b3f39]">
                {menuError}
              </div>
            ) : (
              <div className="grid h-full min-h-0 grid-cols-[1.45fr_1fr] gap-x-[1.8vw] overflow-hidden">
                {renderCategory(categoryConfig[0])}
                <div className="grid min-h-0 auto-rows-min content-start gap-y-[1.2vw] overflow-hidden">
                  {renderCategory(categoryConfig[1])}
                  {renderCategory(categoryConfig[2])}
                </div>
              </div>
            )}
          </div>

          <footer className="grid min-h-0 grid-cols-[1.05fr_0.85fr_1.1fr] gap-[0.8vw] border-t-[0.1vw] border-[#d5cec2] bg-[#ebe7df] px-[2.5vw] py-[0.95vw] text-[#302c27]">
            <section>
              <h3 className="menu-board-panel-title font-serif text-[1vw] font-black uppercase tracking-[0.14em] text-[#302c27] underline decoration-2 underline-offset-[0.18vw]">
                Add-Ons
              </h3>
              <p className="menu-board-panel-copy mt-[0.4vw] text-[0.9vw] font-semibold leading-[1.3]">
                {addOnOptions
                  .map((addOn) => `${addOn.name} (${currencyFormatter.format(addOn.cost)})`)
                  .join(' • ')}
              </p>
            </section>

            <section>
              <h3 className="menu-board-panel-title font-serif text-[1vw] font-black uppercase tracking-[0.14em] text-[#302c27] underline decoration-2 underline-offset-[0.18vw]">
                Sweetness
              </h3>
              <p className="menu-board-panel-copy mt-[0.4vw] text-[0.9vw] font-semibold leading-[1.3]">
                {sweetnessLevels.join(' • ')}
              </p>
            </section>

            <section>
              <h3 className="menu-board-panel-title font-serif text-[1vw] font-black uppercase tracking-[0.14em] text-[#302c27] underline decoration-2 underline-offset-[0.18vw]">
                Ice Level
              </h3>
              <p className="menu-board-panel-copy mt-[0.4vw] text-[0.9vw] font-semibold leading-[1.3]">
                {iceLevels.join(' • ')}
              </p>
            </section>
          </footer>
        </section>
    </main>
  );
}
