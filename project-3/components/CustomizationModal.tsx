'use client';

import { useState } from 'react';
import { MenuItem, CartItem, currencyFormatter } from './pos-types';

type Props = {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (customizedItem: CartItem) => void;
};

const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
const TOPPINGS = ['None', 'Boba', 'Pudding', 'Grass Jelly', 'Red Bean', 'Aloe Vera'];

export default function CustomizationModal({ item, onClose, onConfirm }: Props) {
  const [iceLevel, setIceLevel] = useState('Regular Ice');
  const [sugarLevel, setSugarLevel] = useState('100%');
  const [topping, setTopping] = useState('None');

  const handleConfirm = () => {
    onConfirm({
      ...item,
      quantity: 1,
      iceLevel,
      sugarLevel,
      topping,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative h-48 w-full bg-[#f8f1e7]">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl opacity-20">🍵</div>
          )}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#2f241d] shadow-md hover:bg-white transition-colors"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-[#2f241d]">{item.name}</h2>
          <p className="mt-1 text-lg font-semibold text-[#2f7a5f]">{currencyFormatter.format(item.cost)}</p>

          <div className="mt-6 space-y-6">
            {/* Ice Level */}
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-[#8a6240]">Ice Level</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      iceLevel === level
                        ? 'bg-[#2f7a5f] text-white'
                        : 'bg-[#f8f1e7] text-[#6f5848] hover:bg-[#eadfce]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-[#8a6240]">Sugar Level</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {SUGAR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSugarLevel(level)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      sugarLevel === level
                        ? 'bg-[#2f7a5f] text-white'
                        : 'bg-[#f8f1e7] text-[#6f5848] hover:bg-[#eadfce]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div>
              <label className="text-sm font-bold uppercase tracking-wider text-[#8a6240]">Toppings</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {TOPPINGS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTopping(t)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
                      topping === t
                        ? 'bg-[#2f7a5f] text-white'
                        : 'bg-[#f8f1e7] text-[#6f5848] hover:bg-[#eadfce]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="mt-8 w-full rounded-2xl bg-[#2f7a5f] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#25634d] active:scale-[0.98]"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}
