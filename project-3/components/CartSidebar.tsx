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
};

export default function CartSidebar({
  cart,
  onAdd,
  onRemove,
  onPlaceOrder,
  isPlacingOrder = false,
  extraFields,
  onEditItem,
}: Props) {
  const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <aside className="flex w-full flex-col bg-white shadow-2xl lg:w-[400px]">
      <div className="flex items-center justify-between border-b border-[#eadfce] p-6">
        <h2 className="text-xl font-extrabold">Your Order</h2>
        <span className="rounded-full bg-[#2f7a5f] px-3 py-1 text-xs font-bold text-white">
          {totalItems} items
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {cart.length === 0 ? (
          <div className="mt-12 text-center text-[#6f5848]">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#fdfaf6] text-4xl">
              🛒
            </div>
            <p className="font-medium">Your cart is empty.</p>
            <p className="mt-1 text-sm opacity-60">Tap an item to start ordering.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item, index) => (
              <div
                key={`${item.menuid}-${index}`}
                className="flex items-center gap-4 rounded-xl border border-[#f0e6d8] bg-[#fdfaf6] p-3"
              >
                <div className="flex-1">
                  <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                  <p className="text-xs text-[#8a6240] mt-0.5">
                    {[item.iceLevel, item.sugarLevel, item.topping !== 'None' ? item.topping : null]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="text-[#2f7a5f] text-sm font-semibold mt-1">
                    {currencyFormatter.format(item.cost)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {onEditItem && (
                    <button
                      onClick={() => onEditItem(index)}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#2f7a5f] shadow-sm ring-1 ring-[#eadfce] transition-colors hover:bg-[#f8f1e7]"
                    >
                      Edit
                    </button>
                  )}
                  <div className="flex items-center gap-3 rounded-lg border border-[#eadfce] bg-white p-1">
                    <button
                      onClick={() => onRemove(item.menuid)}
                      className="flex h-8 w-8 items-center justify-center text-[#8a6240] hover:text-red-600 transition-colors"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 12H6" />
                      </svg>
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => onAdd(item)}
                      className="flex h-8 w-8 items-center justify-center text-[#2f7a5f]"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 6v12m-6-6h12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-[#eadfce] bg-[#fdfaf6] p-6 space-y-4">
        {extraFields}

        <div className="flex justify-between text-sm">
          <span className="text-[#6f5848]">Subtotal</span>
          <span className="font-bold">{currencyFormatter.format(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#6f5848]">Estimated Tax (8.25%)</span>
          <span className="font-bold">{currencyFormatter.format(subtotal * 0.0825)}</span>
        </div>
        <div className="flex justify-between text-xl font-extrabold border-t border-[#eadfce] pt-4 mt-2">
          <span>Total</span>
          <span className="text-[#2f7a5f]">{currencyFormatter.format(subtotal * 1.0825)}</span>
        </div>

        <button
          disabled={cart.length === 0 || isPlacingOrder}
          onClick={onPlaceOrder}
          className="w-full rounded-2xl bg-[#2f7a5f] py-5 text-lg font-bold text-white shadow-xl shadow-[#2f7a5f]/20 transition-all hover:bg-[#25614b] active:scale-95 disabled:grayscale disabled:opacity-50"
        >
          {isPlacingOrder ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </aside>
  );
}
