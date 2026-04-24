'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MenuGrid from '@/components/MenuGrid';
import CartSidebar from '@/components/CartSidebar';
import CustomizationModal from '@/components/CustomizationModal';
import {
  categorizeItem,
  currencyFormatter,
  type MenuItem,
  type CartItem,
} from '@/components/pos-types';

import { useLanguage } from '@/lib/LanguageContext';

type ModalState =
  | { mode: 'add'; item: MenuItem }
  | { mode: 'edit'; item: CartItem; index: number };

const hasSameCustomization = (first: CartItem, second: CartItem) =>
  first.menuid === second.menuid &&
  first.iceLevel === second.iceLevel &&
  first.sugarLevel === second.sugarLevel &&
  first.topping === second.topping;

export default function KioskPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error(t('Failed to load menu items.'));
        const data: MenuItem[] = await response.json();
        setItems(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : t('Failed to load menu items.')
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, [t]);

  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => categorizeItem(item.name)));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => categorizeItem(item.name) === activeCategory);
  }, [items, activeCategory]);

  const closeModal = () => setModalState(null);

  const addToCart = (customizedItem: CartItem) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) =>
        hasSameCustomization(item, customizedItem)
      );

      if (existingIndex !== -1) {
        return prev.map((item, index) =>
          index === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...customizedItem, quantity: 1 }];
    });
    closeModal();
  };

  const saveEditedCartItem = (customizedItem: CartItem) => {
    if (!modalState || modalState.mode !== 'edit') return;

    setCart((prev) => {
      const editedItem = prev[modalState.index];
      if (!editedItem) return prev;

      const updatedItem: CartItem = {
        ...customizedItem,
        quantity: editedItem.quantity,
      };

      const matchingIndex = prev.findIndex(
        (item, index) =>
          index !== modalState.index && hasSameCustomization(item, updatedItem)
      );

      if (matchingIndex === -1) {
        return prev.map((item, index) =>
          index === modalState.index ? updatedItem : item
        );
      }

      return prev.reduce<CartItem[]>((next, item, index) => {
        if (index === modalState.index) return next;

        if (index === matchingIndex) {
          next.push({
            ...item,
            quantity: item.quantity + updatedItem.quantity,
          });
          return next;
        }

        next.push(item);
        return next;
      }, []);
    });

    closeModal();
  };

  const removeFromCart = (menuid: number) => {
    setCart((prev) => {
      const index = prev.findLastIndex((i) => i.menuid === menuid);
      if (index === -1) return prev;
      
      const item = prev[index];
      if (item.quantity > 1) {
        return prev.map((i, idx) =>
          idx === index ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);
    try {
      const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
      const costTotal = subtotal * 1.0825;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Kiosk Customer',
          costTotal: costTotal,
          employeeID: 1, // Default kiosk employee
          items: cart.map((item) => ({
            menuid: item.menuid,
            quantity: item.quantity,
            cost: item.cost,
            iceLevel: item.iceLevel,
            sugarLevel: item.sugarLevel,
            topping: item.topping,
          })),
        }),
      });

      if (!response.ok) throw new Error(t('Failed to place order.'));
      
      alert(t('Order Placed Successfully!'));
      setCart([]);
      setIsCartOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('Failed to place order.'));
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#4a554a] text-lg font-medium">
        {t('Preparing Menu...')}
      </main>
    );

  const cartTotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0) * 1.0825;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="flex h-screen flex-col bg-[#fdfaf6] text-[#1f2520] lg:flex-row">
      <section className="flex flex-1 flex-col overflow-hidden border-r border-[#eadfce]">
        <header className="border-b border-[#eadfce] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex h-12 items-center justify-center rounded-full bg-[#f8f1e7] px-5 text-base font-bold text-[#4a554a] transition-all hover:bg-[#e6d8c4] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
                aria-label={t('Back to Portal')}
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="mr-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                {t('Portal')}
              </Link>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#1f2520] lg:text-4xl">
                {t('Kiosk Ordering')}
              </h1>
            </div>
            <div className="hidden sm:block">
              <span className="rounded-full bg-[#f8f1e7] px-6 py-3 text-base font-semibold text-[#4a554a] border border-[#eadfce]">
                {t('Self Service')}
              </span>
            </div>
          </div>

          <nav className="mt-6 flex gap-3 overflow-x-auto pb-4 snap-x" aria-label={t("Menu categories")}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap min-h-[56px] snap-start rounded-full px-8 py-2 text-base font-bold transition-all focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 ${
                  activeCategory === cat
                    ? 'bg-[#2f7a5f] text-white shadow-md'
                    : 'bg-[#f0e6d8] text-[#4a554a] hover:bg-[#e6d8c4]'
                }`}
              >
                {t(cat)}
              </button>
            ))}
          </nav>
        </header>

        <div id="main-content" className="flex-1 overflow-y-auto p-6 pb-32 lg:pb-6">
          <MenuGrid
            items={filteredItems}
            error={error}
            onSelectItem={(item) => setModalState({ mode: 'add', item })}
            showAddIcon={false}
          />
        </div>
      </section>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CartSidebar
          cart={cart}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onPlaceOrder={placeOrder}
          isPlacingOrder={isPlacingOrder}
          onEditItem={(index) => {
            const item = cart[index];
            if (!item) return;
            setModalState({ mode: 'edit', item, index });
          }}
        />
      </div>

      {/* Mobile Sticky Button */}
      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-6 right-6 z-40 lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex w-full items-center justify-between rounded-[24px] bg-[#2f7a5f] p-5 text-white shadow-2xl shadow-[#2f7a5f]/40 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
          >
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                {cartItemCount}
              </span>
              <span className="text-xl font-bold">{t('View Order')}</span>
            </div>
            <span className="text-xl font-bold">
              {currencyFormatter.format(cartTotal)}
            </span>
          </button>
        </div>
      )}

      {/* Mobile Cart Overlay */}
      <CartSidebar
        cart={cart}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onPlaceOrder={placeOrder}
        isPlacingOrder={isPlacingOrder}
        isMobileOverlay={true}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onEditItem={(index) => {
          const item = cart[index];
          if (!item) return;
          setModalState({ mode: 'edit', item, index });
        }}
      />

      {modalState && (
        <CustomizationModal
          key={
            modalState.mode === 'edit'
              ? `edit-${modalState.index}`
              : `add-${modalState.item.menuid}`
          }
          item={modalState.item}
          onClose={closeModal}
          onConfirm={
            modalState.mode === 'edit' ? saveEditedCartItem : addToCart
          }
          initialIceLevel={
            modalState.mode === 'edit' ? modalState.item.iceLevel : undefined
          }
          initialSugarLevel={
            modalState.mode === 'edit' ? modalState.item.sugarLevel : undefined
          }
          initialTopping={
            modalState.mode === 'edit' ? modalState.item.topping : undefined
          }
          confirmLabel={
            modalState.mode === 'edit' ? t('Save Changes') : t('Add to Order')
          }
          presentation="fullscreen"
        />
      )}
    </main>
  );
}
