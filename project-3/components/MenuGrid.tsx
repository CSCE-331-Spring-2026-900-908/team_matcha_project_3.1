'use client';
import {
  currencyFormatter,
  getItemBadge,
  type MenuItem,
} from './pos-types';

type Props = {
  items: MenuItem[];
  error: string | null;
  onSelectItem: (item: MenuItem) => void;
  showAddIcon?: boolean;
};

export default function MenuGrid({
  items,
  error,
  onSelectItem,
  showAddIcon = true,
}: Props) {
  return (
    <>
      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center text-lg font-medium text-red-800">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="list" aria-label="Available drinks">
          {items.map(item => (
            <article
              key={item.menuid}
              role="listitem"
              aria-labelledby={`menu-item-title-${item.menuid}`}
              className="group relative cursor-pointer overflow-hidden rounded-[24px] shadow-[0_8px_24px_rgba(47,36,29,0.10)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(47,36,29,0.16)]"
              onClick={() => onSelectItem(item)}
            >
              {/* Full bleed image */}
              <div className="relative h-64 w-full overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[#eef1ec] text-6xl opacity-50" aria-hidden="true">
                    🍵
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(31,37,32,0.82)_100%)]" />

                {/* Badge */}
                {getItemBadge(item.name) ? (
                  <span className="absolute right-3 top-3 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                    {getItemBadge(item.name)}
                  </span>
                ) : null}

                {/* Name + price + button overlaid on image */}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                  <h3
                    id={`menu-item-title-${item.menuid}`}
                    className="text-lg font-bold leading-tight text-white drop-shadow"
                  >
                    {item.name}
                  </h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold text-white backdrop-blur">
                      {currencyFormatter.format(item.cost)}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2f7a5f]">
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.8">
                        <path d="M12 6v12m-6-6h12" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}