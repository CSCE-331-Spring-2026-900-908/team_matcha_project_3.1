'use client';

import { currencyFormatter, type CartItem } from './pos-types';
import { useLanguage } from '@/lib/LanguageContext';

type Props = {
  cart: CartItem[];
  onAdd: (item: CartItem) => void;
  onRemove: (menuid: number) => void;
  onPlaceOrder: () => void;
  isPlacingOrder?: boolean;
  extraFields?: React.ReactNode;
  onEditItem?: (index: number) => void;
  isMobileOverlay?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

export default function CartSidebar({
  cart,
  onAdd,
  onRemove,
  onPlaceOrder,
  isPlacingOrder = false,
  extraFields,
  onEditItem,
  isMobileOverlay = false,
  isOpen = true,
  onClose,
}: Props) {
  const { t } = useLanguage();
  const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (!isOpen) return null;

  const sidebarContent = (
    <aside className={`flex flex-col bg-white shadow-2xl ${isMobileOverlay ? 'h-full w-full' : 'w-full lg:w-[450px]'}`}>
      <header className="flex items-center justify-between border-b border-[#eadfce] p-8">
        <div className="flex items-center gap-4">
          {isMobileOverlay && onClose && (
            <button
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f1e7] text-[#4a554a] hover:bg-[#e6d8c4] transition-colors focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
              aria-label={t('Back to Menu')}
            >
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-extrabold text-[#1f2520]">{t('Your Order')}</h2>
        </div>
        <span className="rounded-full bg-[#2f7a5f] px-4 py-1.5 text-sm font-bold text-white">
          {totalItems} {t('items')}
        </span>
      </header>

      <section 
        className="flex-1 overflow-y-auto p-8" 
        aria-live="polite"
        aria-label={t("Cart contents")}
      >
        {cart.length === 0 ? (
          <div className="mt-16 text-center text-[#4a554a]">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#fdfaf6] text-5xl" aria-hidden="true">
              🛒
            </div>
            <p className="text-lg font-bold">{t('Your cart is empty.')}</p>
            <p className="mt-2 text-base opacity-75">{t('Tap an item to start ordering.')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {cart.map((item, index) => (
              <div
                key={`${item.menuid}-${index}`}
                className="flex items-center gap-5 rounded-2xl border border-[#f0e6d8] bg-[#fdfaf6] p-4 shadow-sm"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-base leading-tight text-[#1f2520]">{t(item.name)}</h4>
                  <p className="text-sm text-[#4a554a] mt-1">
                    {[
                      item.iceLevel ? t(item.iceLevel) : null,
                      item.sugarLevel ? t(item.sugarLevel) : null,
                      item.topping && item.topping !== 'None' ? t(item.topping) : null
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="text-[#2f7a5f] text-base font-bold mt-2">
                    {currencyFormatter.format(item.cost)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  {onEditItem && (
                    <button
                      onClick={() => onEditItem(index)}
                      className="min-h-[40px] rounded-full bg-white px-5 py-1.5 text-sm font-bold text-[#2f7a5f] shadow-sm ring-1 ring-[#eadfce] transition-all hover:bg-[#f8f1e7] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
                    >
                      {t('Edit')}
                    </button>
                  )}
                  <div className="flex items-center gap-1 rounded-xl border border-[#eadfce] bg-white p-1">
                    <button
                      onClick={() => onRemove(item.menuid)}
                      className="flex h-12 w-12 items-center justify-center text-[#4a554a] hover:text-red-700 transition-colors focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-inset"
                      aria-label={`${t('Decrease quantity of')} ${item.name}`}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path d="M18 12H6" />
                      </svg>
                    </button>
                    <span className="w-6 text-center font-bold text-base text-[#1f2520]">{item.quantity}</span>
                    <button
                      onClick={() => onAdd(item)}
                      className="flex h-12 w-12 items-center justify-center text-[#2f7a5f] hover:bg-[#f8f1e7] rounded-lg transition-colors focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-inset"
                      aria-label={`${t('Increase quantity of')} ${item.name}`}
                    >
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path d="M12 6v12m-6-6h12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-[#eadfce] bg-[#fdfaf6] p-8 space-y-5">
        {extraFields}

        <div className="flex justify-between text-base">
          <span className="text-[#4a554a] font-medium">{t('Subtotal')}</span>
          <span className="font-bold text-[#1f2520]">{currencyFormatter.format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-[#4a554a] font-medium">{t('Estimated Tax')} (8.25%)</span>
          <span className="font-bold text-[#1f2520]">{currencyFormatter.format(subtotal * 0.0825)}</span>
        </div>
        <div className="flex justify-between text-2xl font-extrabold border-t border-[#eadfce] pt-6 mt-2">
          <span className="text-[#1f2520]">{t('Total')}</span>
          <span className="text-[#2f7a5f]">{currencyFormatter.format(subtotal * 1.0825)}</span>
        </div>

        <button
          disabled={cart.length === 0 || isPlacingOrder}
          onClick={() => {
            onPlaceOrder();
            if (isMobileOverlay && onClose) onClose();
          }}
          className="w-full min-h-[64px] rounded-[24px] bg-[#2f7a5f] py-5 text-xl font-bold text-white shadow-xl shadow-[#2f7a5f]/20 transition-all hover:bg-[#25614b] active:scale-95 disabled:grayscale disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
        >
          {isPlacingOrder ? t('Placing Order...') : t('Place Order')}
        </button>
      </footer>
    </aside>
  );

  if (isMobileOverlay) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/50 lg:hidden">
        <div className="mt-auto h-[90%] w-full animate-slide-up overflow-hidden rounded-t-[32px] bg-white shadow-2xl">
          {sidebarContent}
        </div>
      </div>
    );
  }

  return sidebarContent;
}
