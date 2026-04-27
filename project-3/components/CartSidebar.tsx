'use client';

import { currencyFormatter, type CartItem } from './pos-types';

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
  discountAmount?: number;
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
  discountAmount = 0,
}: Props) {
console.log('[CartSidebar] Rendering, isOpen:', isOpen, 'isMobileOverlay:', isMobileOverlay, 'onAdd:', typeof onAdd);
const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
const discounted = Math.max(0, subtotal - discountAmount);
const tax = discounted * 0.0825;
const total = discounted + tax;

  if (!isOpen) return null;

  const sidebarContent = (
    <aside
      aria-label="Order summary"
      className={`flex flex-col bg-[linear-gradient(180deg,#fffdf9_0%,#f7faf7_100%)] shadow-2xl ${
        isMobileOverlay ? 'h-full w-full' : 'w-full lg:h-screen lg:w-[450px]'
      }`}
    >
      <header className="border-b border-[#eadfce] p-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {isMobileOverlay && onClose && (
              <button
                onClick={onClose}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f1e7] text-[#4a554a] transition-colors hover:bg-[#e6d8c4] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
                aria-label="Back to Menu"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6d8a6f]">
                Review
              </p>
              <h2 className="mt-2 text-2xl font-extrabold text-[#1f2520]">Your Order</h2>
            </div>
          </div>
        </div>
      </header>

      <section className="flex-1 overflow-y-auto p-8" aria-live="polite" aria-atomic="true" aria-label="Cart contents">
        {cart.length === 0 ? (
          <div className="mt-12 rounded-[28px] border border-dashed border-[#d7c6b2] bg-white px-6 py-12 text-center text-[#4a554a] shadow-sm">
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_top,#f7efe1,transparent_60%),#eef1ec] text-5xl"
              aria-hidden="true"
            >
              🍵
            </div>
            <p className="text-xl font-bold text-[#1f2520]">No items yet</p>
            <p className="mt-2 text-base opacity-80">Tap a drink card to start building your order.</p>
          </div>
        ) : (
          <div className="space-y-6" role="list">
            {cart.map((item, index) => (
              <div
                key={`${item.menuid}-${index}`}
                role="listitem"
                aria-label={`${item.name}, quantity ${item.quantity}, ${currencyFormatter.format(item.cost * item.quantity)}`}
                className="rounded-[24px] border border-[#e8e2d7] bg-white p-5 shadow-[0_10px_24px_rgba(47,36,29,0.06)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#eef1ec] text-2xl" aria-hidden="true">
                    🍵
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold leading-tight text-[#1f2520]">{item.name}</h4>
                      {item.temperature && (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                          item.temperature === 'Hot'
                            ? 'bg-[#fdf0e8] text-[#c2622a]'
                            : 'bg-[#e8f4f0] text-[#2f7a5f]'
                        }`}>
                          {item.temperature === 'Hot' ? '☕ Hot' : '🧊 Cold'}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-[#4a554a]">
                      {[
                        item.iceLevel ?? null,
                        item.sugarLevel ?? null,
                        item.topping && item.topping !== 'None' ? item.topping : null,
                      ]
                        .filter(Boolean)
                        .join(' • ') || 'Standard build'}
                    </p>
                  </div>
                      <p className="rounded-full bg-[#eef1ec] px-3 py-1 text-sm font-bold text-[#2f7a5f]">
                        {currencyFormatter.format(item.cost * item.quantity)}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      {onEditItem && (
                        <button
                          onClick={() => onEditItem(index)}
                          className="min-h-[40px] rounded-full bg-[#f8f1e7] px-5 py-2 text-sm font-bold text-[#2f7a5f] ring-1 ring-[#eadfce] transition-all hover:bg-[#efe3d0] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
                        >
                          Edit Drink
                        </button>
                      )}
                      <div className="ml-auto flex items-center gap-1 rounded-[18px] border border-[#eadfce] bg-[#fdfaf6] p-1.5">
                        <button
                          onClick={() => onRemove(item.menuid)}
                          className="flex h-11 w-11 items-center justify-center rounded-[14px] text-[#4a554a] transition-colors hover:bg-white hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-inset"
                          aria-label={`Decrease quantity of ${item.name}`}
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path d="M18 12H6" />
                          </svg>
                        </button>
                        <span className="w-8 text-center text-base font-bold text-[#1f2520]" aria-live="polite">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onAdd(item);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-white text-[#2f7a5f] transition-colors hover:bg-[#eef1ec] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-inset"
                          aria-label={`Increase quantity of ${item.name}`}
                          type="button"
                        >
                          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path d="M12 6v12m-6-6h12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          </div>
        )}
      </section>

      <footer className="border-t border-[#eadfce] bg-[linear-gradient(180deg,#fffdf9_0%,#f8f1e7_100%)] p-6 shadow-[0_-8px_30px_rgba(47,36,29,0.06)]">
        <div className="space-y-4 rounded-[28px] border border-[#eadfce] bg-white p-5 shadow-sm" aria-label={`Order total ${currencyFormatter.format(total)}`}>
          {extraFields}

          <div className="flex justify-between text-base">
            <span className="font-medium text-[#4a554a]">Subtotal</span>
            <span className="font-bold text-[#1f2520]">{currencyFormatter.format(subtotal)}</span>
          </div>
          <div className="flex justify-between text-base">
            <span className="font-medium text-[#4a554a]">Estimated Tax (8.25%)</span>
            <span className="font-bold text-[#1f2520]">{currencyFormatter.format(tax)}</span>
          </div>
          <div className="flex justify-between border-t border-[#eadfce] pt-4 text-2xl font-extrabold">
            <span className="text-[#1f2520]">Total</span>
            <span className="text-[#2f7a5f]">{currencyFormatter.format(total)}</span>
          </div>

          <button
            disabled={cart.length === 0 || isPlacingOrder}
            onClick={() => {
              onPlaceOrder();
              if (isMobileOverlay && onClose) onClose();
            }}
            className="w-full min-h-[60px] rounded-[24px] bg-[#2f7a5f] py-4 text-xl font-bold text-white shadow-xl shadow-[#2f7a5f]/20 transition-all hover:bg-[#25614b] active:scale-95 disabled:grayscale disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
          >
            {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>
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
