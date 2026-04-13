'use client';

import { useState } from 'react';
import { MenuItem, CartItem, currencyFormatter } from './pos-types';

type Props = {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (customizedItem: CartItem) => void;
  initialIceLevel?: string;
  initialSugarLevel?: string;
  initialTopping?: string;
  confirmLabel?: string;
  presentation?: 'dialog' | 'fullscreen';
};

const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];
const DEFAULT_ICE_LEVEL = 'Regular Ice';
const DEFAULT_SUGAR_LEVEL = '100%';
const DEFAULT_TOPPING = 'None';
const TOPPING_COSTS: Record<string, number> = {
  None: 0,
  Boba: 0.5,
  Pudding: 0.6,
  'Grass Jelly': 0.5,
  'Red Bean': 0.5,
  'Aloe Vera': 0.7,
};
const TOPPINGS = Object.keys(TOPPING_COSTS);

export default function CustomizationModal({
  item,
  onClose,
  onConfirm,
  initialIceLevel,
  initialSugarLevel,
  initialTopping,
  confirmLabel = 'Add to Order',
  presentation = 'dialog',
}: Props) {
  const [iceLevel, setIceLevel] = useState(initialIceLevel ?? DEFAULT_ICE_LEVEL);
  const [sugarLevel, setSugarLevel] = useState(initialSugarLevel ?? DEFAULT_SUGAR_LEVEL);
  const [topping, setTopping] = useState(initialTopping ?? DEFAULT_TOPPING);

  const toppingCost = TOPPING_COSTS[topping] || 0;
  const totalCost = item.cost + toppingCost;

  const handleConfirm = () => {
    onConfirm({
      ...item,
      cost: totalCost,
      quantity: 1,
      iceLevel,
      sugarLevel,
      topping,
    });
  };

  if (presentation === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-[#fdfaf6] text-[#2f241d]">
        <div className="flex h-full flex-col xl:flex-row">
          <div className="relative bg-[#f8f1e7] xl:basis-2/5 xl:shrink-0">
            <div className="relative h-64 w-full sm:h-72 lg:h-80 xl:h-full">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl opacity-20">
                  🍵
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#2f241d] shadow-md transition-colors hover:bg-white"
            >
              <svg
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col xl:basis-3/5">
            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 lg:px-12">
              <div className="mx-auto w-full max-w-4xl">
                <div className="border-b border-[#eadfce] pb-6">
                  <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#8a6240]">
                    Customize Your Drink
                  </p>
                  <h2 className="mt-3 text-4xl font-bold text-[#2f241d] sm:text-5xl">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-4 mt-3">
                    <p className="text-3xl font-semibold text-[#2f7a5f]">
                      {currencyFormatter.format(totalCost)}
                    </p>
                    {toppingCost > 0 && (
                      <span className="text-sm font-bold text-[#8a6240] bg-[#f8f1e7] px-4 py-1 rounded-full border border-[#eadfce]">
                        Includes {currencyFormatter.format(toppingCost)} add-on
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#eadfce]">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#8a6240]">
                      Ice Level
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {ICE_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setIceLevel(level)}
                          className={`rounded-full px-5 py-3 text-base font-semibold transition-all ${
                            iceLevel === level
                              ? 'bg-[#2f7a5f] text-white shadow-lg'
                              : 'bg-[#f8f1e7] text-[#6f5848] hover:bg-[#eadfce]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#eadfce]">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#8a6240]">
                      Sugar Level
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {SUGAR_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setSugarLevel(level)}
                          className={`rounded-full px-5 py-3 text-base font-semibold transition-all ${
                            sugarLevel === level
                              ? 'bg-[#2f7a5f] text-white shadow-lg'
                              : 'bg-[#f8f1e7] text-[#6f5848] hover:bg-[#eadfce]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#eadfce]">
                    <label className="text-sm font-bold uppercase tracking-wider text-[#8a6240]">
                      Toppings
                    </label>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {TOPPINGS.map((t) => (
                        <button
                          key={t}
                          onClick={() => setTopping(t)}
                          className={`rounded-full px-5 py-3 text-base font-semibold transition-all ${
                            topping === t
                              ? 'bg-[#2f7a5f] text-white shadow-lg'
                              : 'bg-[#f8f1e7] text-[#6f5848] hover:bg-[#eadfce]'
                          }`}
                        >
                          {t}
                          {TOPPING_COSTS[t] > 0 && (
                            <span className="ml-1.5 opacity-60">
                              (+{currencyFormatter.format(TOPPING_COSTS[t])})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[#eadfce] bg-white px-6 py-5 shadow-[0_-8px_30px_rgba(47,36,29,0.06)] sm:px-8 lg:px-12">
              <div className="mx-auto flex w-full max-w-4xl justify-end">
                <button
                  onClick={handleConfirm}
                  className="shrink-0 rounded-2xl bg-[#2f7a5f] px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#25634d] active:scale-[0.98]"
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg font-semibold text-[#2f7a5f]">{currencyFormatter.format(totalCost)}</p>
            {toppingCost > 0 && (
              <span className="text-xs font-medium text-[#8a6240] bg-[#f8f1e7] px-2 py-0.5 rounded-full">
                Includes {currencyFormatter.format(toppingCost)} add-on
              </span>
            )}
          </div>

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
                    {TOPPING_COSTS[t] > 0 && (
                      <span className="ml-1 opacity-60">
                        (+{currencyFormatter.format(TOPPING_COSTS[t])})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="mt-8 w-full rounded-2xl bg-[#2f7a5f] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#25634d] active:scale-[0.98]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
