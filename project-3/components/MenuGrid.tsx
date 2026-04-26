'use client';
import {
  categorizeItem,
  currencyFormatter,
  getCategoryIcon,
  getItemBadge,
  getItemDescription,
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
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'Leaf':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 21c8 0 14-6 14-14C11 7 5 13 5 21Z" />
            <path d="M9 15c2 0 4-2 6-6" />
          </svg>
        );
      case 'Cloud':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 18h11a4 4 0 1 0-.7-7.94A5 5 0 0 0 6.4 8.6 3.5 3.5 0 0 0 6 18Z" />
          </svg>
        );
      case 'Sparkle':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          </svg>
        );
      case 'Star':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
          </svg>
        );
      default:
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 7h16M4 12h16M4 17h10" />
          </svg>
        );
    }
  };

  return (
    <>
      {error ? (
        <div className="rounded-[24px] border border-red-200 bg-red-50 p-6 text-center text-lg font-medium text-red-800">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <article
              key={item.menuid}
              className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#eadfce] bg-[linear-gradient(180deg,#fffdf9_0%,#f8faf7_100%)] shadow-[0_16px_40px_rgba(47,36,29,0.07)] transition-all hover:-translate-y-1 hover:border-[#9ab29b] hover:shadow-[0_22px_44px_rgba(47,36,29,0.12)]"
            >
              <div className="relative h-56 w-full overflow-hidden bg-[#f8f1e7]">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={`${item.name} - ${categorizeItem(item.name)}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,#f7efe1,transparent_58%),linear-gradient(180deg,#f8f1e7_0%,#ecf4f0_100%)] text-6xl opacity-60 transition-colors group-hover:bg-[#ecf4f0]" aria-hidden="true">
                    🍵
                  </div>
                )}
                <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/88 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[#4a554a] backdrop-blur">
                    {renderIcon(getCategoryIcon(categorizeItem(item.name)))}
                    {categorizeItem(item.name)}
                  </span>
                  {getItemBadge(item.name) ? (
                    <span className="rounded-full bg-[#1f2520]/80 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white">
                      {getItemBadge(item.name)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6 text-left">
                <h3 className="text-[1.45rem] font-bold leading-tight text-[#1f2520]">{item.name}</h3>
                <p className="mt-3 text-sm leading-6 text-[#5c655c]">
                  {getItemDescription(item.name)}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#eef1ec] px-3 py-1 text-xs font-semibold text-[#4a554a]">
                    Customizable
                  </span>
                  <span className="rounded-full bg-[#f8f1e7] px-3 py-1 text-xs font-semibold text-[#7b6041]">
                    Ready fast
                  </span>
                </div>
                <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6d8a6f]">
                      Starting at
                    </p>
                    <p className="mt-2 inline-flex rounded-full bg-[#2f7a5f] px-4 py-2 text-xl font-bold text-white shadow-lg shadow-[#2f7a5f]/15">
                      {currencyFormatter.format(item.cost)}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectItem(item)}
                    className="inline-flex min-h-[52px] items-center gap-3 rounded-full border border-[#cfe0d1] bg-white px-5 py-3 text-base font-bold text-[#2f7a5f] transition-all hover:border-[#2f7a5f] hover:bg-[#f3f8f4] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
                    aria-label={`Add ${item.name} to order`}
                  >
                    <span>{showAddIcon ? 'Add Drink' : 'Customize'}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef1ec] text-[#2f7a5f]" aria-hidden="true">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 6v12m-6-6h12" />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
