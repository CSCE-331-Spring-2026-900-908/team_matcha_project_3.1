'use client';
import {
  categorizeItem,
  currencyFormatter,
  getStockStatusLabel,
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
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => {
            const stockLabel = getStockStatusLabel(item.stockStatus);

            return (
              <button
                key={item.menuid}
                onClick={() => onSelectItem(item)}
                className={`group flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-lg active:scale-95 ${
                  item.stockStatus === 'out'
                    ? 'border-[#d98f86] bg-[#fff0ed]'
                    : item.stockStatus === 'low'
                      ? 'border-[#e0c46f] bg-[#fff8d7]'
                      : 'border-[#eadfce] bg-white hover:border-[#2f7a5f]'
                }`}
              >
              <div className="flex flex-1 flex-col p-4 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase text-[#8a6240] opacity-70">
                    {categorizeItem(item)}
                  </span>
                  {stockLabel ? (
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] ${
                        item.stockStatus === 'out'
                          ? 'border-[#b85d53] bg-[#c94335] text-white'
                          : 'border-[#b98d1f] bg-[#b98712] text-white'
                      }`}
                    >
                      {stockLabel}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-1 font-bold leading-tight text-[#2f241d]">{item.name}</h3>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-[#2f7a5f]">
                    {currencyFormatter.format(item.cost)}
                  </p>
                  {showAddIcon && (
                    <div className="rounded-full bg-[#f8f1e7] p-1 text-[#2f7a5f] group-hover:bg-[#2f7a5f] group-hover:text-white transition-colors">
                      <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 6v12m-6-6h12" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
            );
          })}
        </div>
      )}
    </>
  );
}
