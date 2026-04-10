'use client';
import { categorizeItem, currencyFormatter, type MenuItem } from './pos-types';

type Props = {
  items: MenuItem[];
  error: string | null;
  onAddToCart: (item: MenuItem) => void;
};

export default function MenuGrid({ items, error, onAddToCart }: Props) {
  return (
    <>
      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <button
              key={item.menuid}
              onClick={() => onAddToCart(item)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[#eadfce] bg-white transition-all hover:border-[#2f7a5f] hover:shadow-lg active:scale-95"
            >
              <div className="h-32 w-full bg-[#f8f1e7] group-hover:bg-[#ecf4f0] transition-colors flex items-center justify-center text-4xl opacity-40">
                🍵
              </div>
              <div className="flex flex-1 flex-col p-4 text-left">
                <span className="text-xs font-bold uppercase text-[#8a6240] opacity-70">
                  {categorizeItem(item.name)}
                </span>
                <h3 className="mt-1 font-bold leading-tight text-[#2f241d]">{item.name}</h3>
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-[#2f7a5f]">
                    {currencyFormatter.format(item.cost)}
                  </p>
                  <div className="rounded-full bg-[#f8f1e7] p-1 text-[#2f7a5f] group-hover:bg-[#2f7a5f] group-hover:text-white transition-colors">
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 6v12m-6-6h12" />
                    </svg>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}