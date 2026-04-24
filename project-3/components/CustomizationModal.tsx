'use client';

import { useState } from 'react';
import { MenuItem, CartItem, currencyFormatter } from './pos-types';
import { useLanguage } from '@/lib/LanguageContext';

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
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%', '125%'];
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
  confirmLabel,
  presentation = 'dialog',
}: Props) {
  const { t } = useLanguage();
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

  const finalConfirmLabel = confirmLabel || t('Add to Order');

  if (presentation === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 bg-[#fdfaf6] text-[#1f2520]">
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
                <div className="flex h-full items-center justify-center text-8xl opacity-20" aria-hidden="true">
                  🍵
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#1f2520] shadow-lg transition-all hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
              aria-label={t('Close customization')}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col xl:basis-3/5">
            <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10 lg:px-16">
              <div className="mx-auto w-full max-w-4xl">
                <header className="border-b border-[#eadfce] pb-8">
                  <p className="text-base font-bold uppercase tracking-[0.3em] text-[#4a554a]">
                    {t('Customize Your Drink')}
                  </p>
                  <h2 className="mt-4 text-4xl font-bold text-[#1f2520] sm:text-5xl lg:text-6xl">
                    {item.name}
                  </h2>
                  <div className="flex items-center gap-6 mt-5">
                    <p className="text-4xl font-bold text-[#2f7a5f]">
                      {currencyFormatter.format(totalCost)}
                    </p>
                    {toppingCost > 0 && (
                      <span className="text-sm font-bold text-[#4a554a] bg-[#f8f1e7] px-5 py-1.5 rounded-full border border-[#eadfce]">
                        {t('Includes')} {currencyFormatter.format(toppingCost)} {t('add-on')}
                      </span>
                    )}
                  </div>
                </header>

                <div className="mt-10 space-y-8">
                  <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#eadfce]">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">
                      {t('Ice Level')}
                    </h3>
                    <div className="mt-6 flex flex-wrap gap-4">
                      {ICE_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setIceLevel(level)}
                          className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                            iceLevel === level
                              ? 'bg-[#2f7a5f] text-white shadow-xl'
                              : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                          }`}
                        >
                          {t(level)}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#eadfce]">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">
                      {t('Sugar Level')}
                    </h3>
                    <div className="mt-6 flex flex-wrap gap-4">
                      {SUGAR_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setSugarLevel(level)}
                          className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                            sugarLevel === level
                              ? 'bg-[#2f7a5f] text-white shadow-xl'
                              : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                          }`}
                        >
                          {t(level)}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#eadfce]">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">
                      {t('Toppings')}
                    </h3>
                    <div className="mt-6 flex flex-wrap gap-4">
                      {TOPPINGS.map((t_name) => (
                        <button
                          key={t_name}
                          onClick={() => setTopping(t_name)}
                          className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                            topping === t_name
                              ? 'bg-[#2f7a5f] text-white shadow-xl'
                              : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                          }`}
                        >
                          {t(t_name)}
                          {TOPPING_COSTS[t_name] > 0 && (
                            <span className="ml-2 opacity-70 font-medium">
                              (+{currencyFormatter.format(TOPPING_COSTS[t_name])})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </main>

            <footer className="border-t border-[#eadfce] bg-white px-8 py-6 shadow-[0_-8px_30px_rgba(47,36,29,0.06)] sm:px-10 lg:px-16">
              <div className="mx-auto flex w-full max-w-4xl justify-end">
                <button
                  onClick={handleConfirm}
                  className="shrink-0 min-h-[64px] min-w-[200px] rounded-[24px] bg-[#2f7a5f] px-10 py-5 text-xl font-bold text-white shadow-xl shadow-[#2f7a5f]/20 transition-all hover:bg-[#25634d] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
                >
                  {finalConfirmLabel}
                </button>
              </div>
            </footer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] bg-white shadow-2xl">
        <header className="relative h-56 w-full bg-[#f8f1e7]">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl opacity-20" aria-hidden="true">🍵</div>
          )}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#1f2520] shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
            aria-label={t('Close customization')}
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="p-8">
          <h2 className="text-3xl font-bold text-[#1f2520]">{item.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-2xl font-bold text-[#2f7a5f]">{currencyFormatter.format(totalCost)}</p>
            {toppingCost > 0 && (
              <span className="text-sm font-bold text-[#4a554a] bg-[#f8f1e7] px-3 py-1 rounded-full border border-[#eadfce]">
                {t('Includes')} {currencyFormatter.format(toppingCost)} {t('add-on')}
              </span>
            )}
          </div>

          <div className="mt-8 space-y-8 max-h-[50vh] overflow-y-auto pr-2">
            {/* Ice Level */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">{t('Ice Level')}</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {ICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                      iceLevel === level
                        ? 'bg-[#2f7a5f] text-white shadow-md'
                        : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                    }`}
                  >
                    {t(level)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sugar Level */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">{t('Sugar Level')}</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {SUGAR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSugarLevel(level)}
                    className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                      sugarLevel === level
                        ? 'bg-[#2f7a5f] text-white shadow-md'
                        : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                    }`}
                  >
                    {t(level)}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">{t('Toppings')}</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {TOPPINGS.map((t_name) => (
                  <button
                    key={t_name}
                    onClick={() => setTopping(t_name)}
                    className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                      topping === t_name
                        ? 'bg-[#2f7a5f] text-white shadow-md'
                        : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                    }`}
                  >
                    {t(t_name)}
                    {TOPPING_COSTS[t_name] > 0 && (
                      <span className="ml-1.5 opacity-70 font-medium">
                        (+{currencyFormatter.format(TOPPING_COSTS[t_name])})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="mt-10 w-full min-h-[64px] rounded-[24px] bg-[#2f7a5f] py-5 text-xl font-bold text-white shadow-xl shadow-[#2f7a5f]/20 transition-all hover:bg-[#25634d] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
          >
            {finalConfirmLabel}
          </button>
        </main>
      </div>
    </div>
  );
}
