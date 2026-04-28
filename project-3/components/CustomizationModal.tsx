'use client';

import { useState } from 'react';
import { MenuItem, CartItem, currencyFormatter, supportsHot } from './pos-types';
import { CUP_SIZES, DEFAULT_CUP_SIZE, type CupSize } from '@/lib/cup-sizes';
import {
  AVAILABLE_TOPPINGS,
  formatToppings,
  getToppingsCost,
  NO_TOPPING,
  parseToppings,
  TOPPING_COSTS,
} from '@/lib/toppings';

type Props = {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (customizedItem: CartItem) => void;
  initialIceLevel?: string;
  initialSugarLevel?: string;
  initialTopping?: string;
  initialTemperature?: 'Hot' | 'Cold';
  initialCupSize?: CupSize;
  confirmLabel?: string;
  presentation?: 'dialog' | 'fullscreen';
  showDialogImage?: boolean;
};

const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%', '125%'];
const DEFAULT_ICE_LEVEL = 'Regular Ice';
const DEFAULT_SUGAR_LEVEL = '100%';

export default function CustomizationModal({
  item,
  onClose,
  onConfirm,
  initialIceLevel,
  initialSugarLevel,
  initialTopping,
  initialTemperature,
  initialCupSize,
  confirmLabel,
  presentation = 'dialog',
  showDialogImage = true,
}: Props) {
  const hotEligible = supportsHot(item.name);

  const [iceLevel, setIceLevel] = useState(initialIceLevel ?? DEFAULT_ICE_LEVEL);
  const [sugarLevel, setSugarLevel] = useState(initialSugarLevel ?? DEFAULT_SUGAR_LEVEL);
  const [selectedToppings, setSelectedToppings] = useState(() => parseToppings(initialTopping));
  const [cupSize, setCupSize] = useState<CupSize>(initialCupSize ?? DEFAULT_CUP_SIZE);
  // Default to 'Cold' if not hot-eligible, otherwise respect initialTemperature or default 'Cold'
  const [temperature, setTemperature] = useState<'Hot' | 'Cold'>(
    !hotEligible ? 'Cold' : (initialTemperature ?? 'Cold')
  );

  const topping = formatToppings(selectedToppings);
  const toppingCost = getToppingsCost(selectedToppings);
  const totalCost = item.cost + toppingCost;

  const toggleTopping = (toppingName: string) => {
    setSelectedToppings((current) =>
      current.includes(toppingName)
        ? current.filter((selected) => selected !== toppingName)
        : [...current, toppingName]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      ...item,
      cost: totalCost,
      quantity: 1,
      iceLevel: iceLevel || undefined,
      sugarLevel,
      topping,
      temperature,
      cupSize,
    });
  };

  const finalConfirmLabel = confirmLabel || 'Add to Order';

  // Reusable temperature toggle — used in both dialog and fullscreen
  const TemperatureToggle = () => (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Temperature</h3>
      <div className="mt-3 flex gap-3">
        {(['Cold', 'Hot'] as const).map((temp) => (
          <button
            key={temp}
            onClick={() => {
              setTemperature(temp);
              if (temp === 'Hot') setIceLevel('');
            }}
            aria-pressed={temperature === temp}
            className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
              temperature === temp
                ? temp === 'Hot'
                  ? 'bg-[#d98c5f] text-white shadow-md'
                  : 'bg-[#6a5ea4] text-white shadow-md'
                : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
            }`}
          >
            {temp === 'Hot' ? '☕ Hot' : '🧊 Cold'}
          </button>
        ))}
      </div>
    </div>
  );

  const CupSizeToggle = () => (
    <div>
      <h3 className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Cup Size</h3>
      <div className="mt-3 flex flex-wrap gap-3" role="group" aria-label="Cup Size">
        {CUP_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setCupSize(size)}
            aria-pressed={cupSize === size}
            className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
              cupSize === size ? 'bg-[#2f7a5f] text-white shadow-md' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );

  if (presentation === 'fullscreen') {
    return (
      <div className="fixed inset-0 z-50 matcha-surface animate-fade-in text-[#1f2520]" role="dialog" aria-modal="true" aria-labelledby="customization-title-fullscreen" aria-describedby="customization-summary-fullscreen">
        <div className="flex h-full flex-col animate-fade-in-up xl:flex-row">
          <div className="relative bg-[linear-gradient(180deg,#f8f1e7_0%,#eef1ec_100%)] xl:basis-2/5 xl:shrink-0">
            <div className="relative h-64 w-full sm:h-72 lg:h-80 xl:h-full">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-8xl opacity-20" aria-hidden="true">🍵</div>
              )}
            </div>
            <div className="absolute bottom-6 left-6 right-6 rounded-[28px] bg-white/92 p-5 shadow-xl backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6d8a6f]">Drink Summary</p>
              <h3 className="mt-2 text-2xl font-bold text-[#1f2520]">{item.name}</h3>
              <p id="customization-summary-fullscreen" className="mt-2 text-sm leading-6 text-[#4a554a]">
                Choose the sweetness, ice, and topping combination that fits the guest and the drink.
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute right-6 top-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-[#1f2520] shadow-lg transition-all hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
              aria-label="Close customization"
            >
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col xl:basis-3/5">
            <main className="flex-1 overflow-y-auto px-8 py-10 sm:px-10 lg:px-16">
              <div className="mx-auto w-full max-w-4xl">
                <header className="border-b border-[#eadfce] pb-8">
                  <p className="text-base font-bold uppercase tracking-[0.3em] text-[#4a554a]">Customize Your Drink</p>
                  <h2 id="customization-title-fullscreen" className="mt-4 text-4xl font-bold text-[#1f2520] sm:text-5xl lg:text-6xl">{item.name}</h2>
                  <div className="mt-5 flex flex-wrap items-center gap-4">
                    <p className="text-4xl font-bold text-[#2f7a5f]">{currencyFormatter.format(totalCost)}</p>
                    <span className="rounded-full border border-[#dce5d8] bg-[#eef1ec] px-5 py-1.5 text-sm font-bold text-[#2f7a5f]">Made to order</span>
                    {toppingCost > 0 && (
                      <span className="text-sm font-bold text-[#4a554a] bg-[#f8f1e7] px-5 py-1.5 rounded-full border border-[#eadfce]">
                        Includes {currencyFormatter.format(toppingCost)} add-on
                      </span>
                    )}
                  </div>
                </header>

                <div className="mt-10 space-y-8">
                  {CupSizeToggle()}

                  {hotEligible && TemperatureToggle()}

                  {temperature === 'Cold' && (
                    <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#eadfce]">
                      <h3 id="ice-level-heading-fullscreen" className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Ice Level</h3>
                      <div className="mt-6 flex flex-wrap gap-4" role="group" aria-labelledby="ice-level-heading-fullscreen">
                        {ICE_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setIceLevel(level)}
                          aria-pressed={iceLevel === level}
                          className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                            iceLevel === level ? 'bg-[#2f7a5f] text-white shadow-xl' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </section>
                  )}

                  <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#eadfce]">
                    <h3 id="sugar-level-heading-fullscreen" className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Sugar Level</h3>
                    <div className="mt-6 flex flex-wrap gap-4" role="group" aria-labelledby="sugar-level-heading-fullscreen">
                      {SUGAR_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setSugarLevel(level)}
                          aria-pressed={sugarLevel === level}
                          className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                            sugarLevel === level ? 'bg-[#2f7a5f] text-white shadow-xl' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[32px] bg-white p-8 shadow-sm ring-1 ring-[#eadfce]">
                    <h3 id="toppings-heading-fullscreen" className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Toppings</h3>
                    <div className="mt-6 flex flex-wrap gap-4" role="group" aria-labelledby="toppings-heading-fullscreen">
                      <button
                        key={NO_TOPPING}
                        onClick={() => setSelectedToppings([])}
                        aria-pressed={selectedToppings.length === 0}
                        className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                          selectedToppings.length === 0 ? 'bg-[#2f7a5f] text-white shadow-xl' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                        }`}
                      >
                        {NO_TOPPING}
                      </button>
                      {AVAILABLE_TOPPINGS.map((t_name) => (
                        <button
                          key={t_name}
                          onClick={() => toggleTopping(t_name)}
                          aria-pressed={selectedToppings.includes(t_name)}
                          className={`min-h-[56px] rounded-full px-8 py-3 text-lg font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                            selectedToppings.includes(t_name) ? 'bg-[#2f7a5f] text-white shadow-xl' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                          }`}
                        >
                          {t_name}
                          {TOPPING_COSTS[t_name] > 0 && (
                            <span className="ml-2 opacity-70 font-medium">(+{currencyFormatter.format(TOPPING_COSTS[t_name])})</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </main>

            <footer className="border-t border-[#eadfce] bg-white px-8 py-6 shadow-[0_-8px_30px_rgba(47,36,29,0.06)] sm:px-10 lg:px-16">
              <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-6">
                <div className="hidden sm:block">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#6d8a6f]">Current total</p>
                  <p className="mt-2 text-3xl font-bold text-[#1f2520]">{currencyFormatter.format(totalCost)}</p>
                </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="customization-title-dialog" aria-describedby="customization-price-dialog">
      <div className="relative w-full max-w-7xl overflow-hidden rounded-[32px] bg-white shadow-2xl animate-scale-in">
        {showDialogImage ? (
        <header className="relative h-56 w-full bg-[#f8f1e7]">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-7xl opacity-20" aria-hidden="true">🍵</div>
          )}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[#1f2520] shadow-md hover:bg-white transition-colors focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
            aria-label="Close customization"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>
        ) : (
          <button
            onClick={onClose}
            className="absolute right-5 top-5 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#f8f1e7] text-[#1f2520] shadow-md hover:bg-[#eadfce] transition-colors focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
            aria-label="Close customization"
          >
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}

        <main className="p-8">
          <h2 id="customization-title-dialog" className="pr-14 text-3xl font-bold text-[#1f2520]">{item.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <p id="customization-price-dialog" className="text-2xl font-bold text-[#2f7a5f]">{currencyFormatter.format(totalCost)}</p>
            {toppingCost > 0 && (
              <span className="text-sm font-bold text-[#4a554a] bg-[#f8f1e7] px-3 py-1 rounded-full border border-[#eadfce]">
                Includes {currencyFormatter.format(toppingCost)} add-on
              </span>
            )}
          </div>

          <div className="mt-8 space-y-8 max-h-[50vh] overflow-y-auto pr-2">
            {CupSizeToggle()}

            {hotEligible && TemperatureToggle()}

            {/* Ice Level */}
          {temperature === 'Cold' && (
            <div>
              <h3 id="ice-level-heading-dialog" className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Ice Level</h3>
              <div className="mt-3 flex flex-wrap gap-3" role="group" aria-labelledby="ice-level-heading-dialog">

                {ICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setIceLevel(level)}
                    aria-pressed={iceLevel === level}
                    className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                      iceLevel === level ? 'bg-[#2f7a5f] text-white shadow-md' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
            )}

            {/* Sugar Level */}
            <div>
              <h3 id="sugar-level-heading-dialog" className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Sugar Level</h3>
              <div className="mt-3 flex flex-wrap gap-3" role="group" aria-labelledby="sugar-level-heading-dialog">
                {SUGAR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setSugarLevel(level)}
                    aria-pressed={sugarLevel === level}
                    className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                      sugarLevel === level ? 'bg-[#2f7a5f] text-white shadow-md' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Toppings */}
            <div>
              <h3 id="toppings-heading-dialog" className="text-sm font-bold uppercase tracking-wider text-[#4a554a]">Toppings</h3>
              <div className="mt-3 flex flex-wrap gap-3" role="group" aria-labelledby="toppings-heading-dialog">
                <button
                  key={NO_TOPPING}
                  onClick={() => setSelectedToppings([])}
                  aria-pressed={selectedToppings.length === 0}
                  className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                    selectedToppings.length === 0 ? 'bg-[#2f7a5f] text-white shadow-md' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                  }`}
                >
                  {NO_TOPPING}
                </button>
                {AVAILABLE_TOPPINGS.map((t_name) => (
                  <button
                    key={t_name}
                    onClick={() => toggleTopping(t_name)}
                    aria-pressed={selectedToppings.includes(t_name)}
                    className={`min-h-[48px] rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] ${
                      selectedToppings.includes(t_name) ? 'bg-[#2f7a5f] text-white shadow-md' : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#eadfce]'
                    }`}
                  >
                    {t_name}
                    {TOPPING_COSTS[t_name] > 0 && (
                      <span className="ml-1.5 opacity-70 font-medium">(+{currencyFormatter.format(TOPPING_COSTS[t_name])})</span>
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
