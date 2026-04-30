'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MenuItem as SharedMenuItem } from '@/components/pos-types';
import { categorizeMenuItem } from '@/lib/menu-categories';
import { AVAILABLE_TOPPINGS, TOPPING_COSTS } from '@/lib/toppings';

type MenuItem = Pick<
  SharedMenuItem,
  | 'menuid'
  | 'name'
  | 'cost'
  | 'category_label'
  | 'category_color'
  | 'category_display_order'
>;

type BoardCategory = {
  label: string;
  color: string;
  order: number;
  items: MenuItem[];
};

const sweetnessLevels = ['0%', '25%', '50%', '75%', '100%', '125%'];
const iceLevels = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const menuColumnCapacity = 22;
const addOnOptions = AVAILABLE_TOPPINGS.map((name) => ({
  name,
  cost: TOPPING_COSTS[name],
})).sort((first, second) => first.cost - second.cost || first.name.localeCompare(second.name));

const priceFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

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

  const groupedItems = useMemo<BoardCategory[]>(() => {
    const groups = new Map<string, BoardCategory>();

    for (const item of items) {
      const fallbackCategory = categorizeMenuItem(item.name);
      const label = item.category_label ?? fallbackCategory?.label ?? 'Other';
      const color = item.category_color ?? fallbackCategory?.color ?? '#667463';
      const fallbackOrder = fallbackCategory
        ? ['Milk Teas', 'Fruit Teas', 'Green & Oolong Teas'].indexOf(
            fallbackCategory.label
          )
        : -1;
      const order =
        typeof item.category_display_order === 'number'
          ? item.category_display_order
          : fallbackOrder === -1
            ? Number.MAX_SAFE_INTEGER
            : 1000 + fallbackOrder;
      const current = groups.get(label) ?? { label, color, order, items: [] };

      current.items.push(item);
      current.order = Math.min(current.order, order);
      groups.set(label, current);
    }

    return Array.from(groups.values()).sort(
      (first, second) =>
        first.order - second.order || first.label.localeCompare(second.label)
    );
  }, [items]);

  const menuColumnCount = useMemo(() => {
    const estimatedRows = groupedItems.reduce(
      (total, category) => total + category.items.length + 2,
      0
    );

    return Math.min(3, Math.max(1, Math.ceil(estimatedRows / menuColumnCapacity)));
  }, [groupedItems]);

  function renderCategory(category: BoardCategory) {
    return (
      <section
        key={category.label}
        className="mb-[1.05vw] inline-block w-full break-inside-avoid align-top [break-inside:avoid]"
      >
        <div
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-[0.35vw] border-b-[0.1vw] border-[#454039] pb-[0.22vw]"
          style={{ color: category.color }}
        >
          <h2 className="menu-board-category-title truncate font-serif text-[1.45vw] font-black uppercase leading-none tracking-[0.01em]">
            {category.label}
          </h2>
          <span className="menu-board-price-label text-[0.64vw] font-black uppercase tracking-[0.08em] text-[#777064]">
            Price
          </span>
        </div>

        <ol className="grid min-h-0 auto-rows-min content-start gap-[0.2vw] pt-[0.32vw]">
          {category.items.map((item, index) => (
            <li
              key={item.menuid}
              className="grid min-w-0 grid-cols-[1.22vw_minmax(0,1fr)_auto] items-center gap-[0.28vw] rounded-[0.32vw] border border-transparent px-[0.12vw]"
            >
              <span className="menu-board-index grid h-[1.22vw] w-[1.22vw] shrink-0 place-items-center rounded-full border border-[#9c968c] font-serif text-[0.58vw] font-bold leading-none text-[#686158]">
                {index + 1}
              </span>
              <div className="flex min-w-0 items-center gap-[0.3vw]">
                <span className="menu-board-item-name min-w-0 truncate text-[0.96vw] font-bold leading-tight text-[#302c27]">
                  {item.name}
                </span>
                <span
                  className="h-px min-w-[0.45vw] flex-1 border-t-[0.1vw] border-dotted"
                  style={{ borderColor: category.color }}
                  aria-hidden="true"
                />
              </div>
              <span className="menu-board-item-price font-serif text-[0.96vw] font-black leading-none text-[#27231f]">
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
        className="menu-board grid h-full w-full min-h-0 grid-rows-[10%_1fr_16%] overflow-hidden border-[0.18vw] border-[#d8d1c5] bg-[#fffdf8] text-[#28251f] shadow-[0_1vw_3.3vw_rgba(16,24,20,0.28)]"
        aria-label="Bubble tea menu board display"
      >
          <header className="flex min-h-0 items-center border-b-[0.16vw] border-[#37332c] px-[2vw] py-[0.65vw]">
            <div className="min-w-0">
              <p className="menu-board-eyebrow font-serif text-[0.7vw] font-bold uppercase tracking-[0.22em] text-[#6b6458]">
                Team Matcha
              </p>
              <h1 className="menu-board-title truncate font-serif text-[2.45vw] font-black uppercase leading-none tracking-normal text-[#25211d]">
                Bubble Tea Menu
              </h1>
            </div>
          </header>

          <div className="min-h-0 overflow-hidden px-[1.35vw] py-[0.7vw]">
            {isLoading ? (
              <div className="menu-board-status grid h-full place-items-center font-serif text-[1.45vw] font-bold uppercase tracking-[0.16em] text-[#6b6458]">
                Loading menu...
              </div>
            ) : menuError ? (
              <div className="menu-board-status grid h-full place-items-center px-[2vw] text-center font-serif text-[1.4vw] font-bold text-[#8b3f39]">
                {menuError}
              </div>
            ) : (
              <div
                className="h-full min-h-0 overflow-hidden [column-fill:auto]"
                style={{ columnCount: menuColumnCount, columnGap: '1.35vw' }}
              >
                {groupedItems.map(renderCategory)}
              </div>
            )}
          </div>

          <footer className="grid min-h-0 grid-cols-[minmax(0,1fr)_30vw] gap-[1vw] border-t-[0.1vw] border-[#d5cec2] bg-[#ebe7df] px-[2vw] py-[0.62vw] text-[#302c27]">
            <section className="min-w-0">
              <h3 className="menu-board-panel-title font-serif text-[0.9vw] font-black uppercase tracking-[0.14em] text-[#302c27] underline decoration-2 underline-offset-[0.15vw]">
                Add-Ons
              </h3>
              <p className="mt-[0.32vw] whitespace-normal break-words text-[0.9vw] font-semibold leading-[1.35]">
                {addOnOptions
                  .map((addOn) => `${addOn.name} (${currencyFormatter.format(addOn.cost)})`)
                  .join(' | ')}
              </p>
            </section>

            <div className="grid min-w-0 grid-cols-2 gap-[0.85vw]">
              <section className="min-w-0">
                <h3 className="menu-board-panel-title font-serif text-[0.78vw] font-black uppercase tracking-[0.14em] text-[#302c27] underline decoration-2 underline-offset-[0.15vw]">
                  Sweetness
                </h3>
                <p className="menu-board-panel-copy mt-[0.28vw] text-[0.72vw] font-semibold leading-[1.25]">
                  {sweetnessLevels.join(' | ')}
                </p>
              </section>

              <section className="min-w-0">
                <h3 className="menu-board-panel-title font-serif text-[0.78vw] font-black uppercase tracking-[0.14em] text-[#302c27] underline decoration-2 underline-offset-[0.15vw]">
                  Ice Level
                </h3>
                <p className="menu-board-panel-copy mt-[0.28vw] text-[0.72vw] font-semibold leading-[1.25]">
                  {iceLevels.join(' | ')}
                </p>
              </section>
            </div>
          </footer>
        </section>
    </main>
  );
}
