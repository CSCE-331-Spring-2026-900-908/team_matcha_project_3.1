'use client';

export type UnavailableOrderItem = {
  itemName: string;
  ingredientName: string;
  requested: number;
  available: number;
  unavailableQuantity?: number;
  type: 'menu-item' | 'topping';
};

type Props = {
  items: UnavailableOrderItem[];
  onClose: () => void;
  showDetails?: boolean;
};

export default function OrderUnavailableModal({ items, onClose, showDetails = true }: Props) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#1f2520]/65 p-6 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="unavailable-order-title"
    >
      <div className="w-full max-w-md rounded-[28px] border border-[#e8b8b2] bg-white p-7 text-center shadow-[0_30px_80px_rgba(31,37,32,0.28)]">
        <h2 id="unavailable-order-title" className="text-2xl font-extrabold text-[#1f2520]">
          Unable to Order
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#4a554a]">
          {showDetails
            ? 'Remove or edit unavailable items to continue.'
            : 'Remove or edit these items to continue.'}
        </p>

        {items.length > 0 ? (
          <div className="mt-5 space-y-3 text-left">
            {items.map((item, index) => (
              <div
                key={`${item.itemName}-${item.ingredientName}-${index}`}
                className="rounded-[18px] border border-[#f0d4d0] bg-[#fff4f2] px-4 py-3"
              >
                <p className="font-bold text-[#1f2520]">
                  {item.itemName} - {item.unavailableQuantity ?? 1} unavailable
                </p>
                {showDetails ? (
                  <>
                    <p className="mt-1 text-sm text-[#7a4c45]">
                      Missing ingredient: {item.ingredientName}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#97463c]">
                      Needed {item.requested}, available {item.available}
                    </p>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-6 min-h-[48px] w-full rounded-[18px] bg-[#2f7a5f] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#25614b] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]/30"
        >
          Review Order
        </button>
      </div>
    </div>
  );
}
