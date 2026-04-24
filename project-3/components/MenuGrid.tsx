'use client';
import { categorizeItem, currencyFormatter, type MenuItem } from './pos-types';
import { useLanguage } from '@/lib/LanguageContext';

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
  const { t } = useLanguage();
  return (
    <>
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800 text-lg font-medium">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <button
              key={item.menuid}
              onClick={() => onSelectItem(item)}
              className="group flex flex-col overflow-hidden rounded-[24px] border border-[#eadfce] bg-white transition-all hover:border-[#2f7a5f] hover:shadow-xl active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
              aria-label={`${t('Add')} ${item.name} ${t('to order')}`}
            >
              <div className="h-52 w-full overflow-hidden bg-[#f8f1e7]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={`${item.name} - ${t(categorizeItem(item.name))}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl opacity-40 group-hover:bg-[#ecf4f0] transition-colors" aria-hidden="true">
                    🍵
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6 text-left">
                <span className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">
                  {t(categorizeItem(item.name))}
                </span>
                <h3 className="mt-2 text-xl font-bold leading-tight text-[#1f2520]">{t(item.name)}</h3>
                <div className="mt-auto pt-4 flex items-center justify-between">
                  <p className="text-xl font-bold text-[#2f7a5f]">
                    {currencyFormatter.format(item.cost)}
                  </p>
                  {showAddIcon && (
                    <div className="rounded-full bg-[#f8f1e7] p-2 text-[#2f7a5f] group-hover:bg-[#2f7a5f] group-hover:text-white transition-colors" aria-hidden="true">
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 6v12m-6-6h12" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
