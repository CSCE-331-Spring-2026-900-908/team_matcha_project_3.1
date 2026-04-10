'use client';

import { useEffect, useMemo, useState } from 'react';
import MenuGrid from '@/components/MenuGrid';
import CartSidebar from '@/components/CartSidebar';
import CustomizationModal from '@/components/CustomizationModal';
import {
  categorizeItem,
  type MenuItem,
  type CartItem,
} from '@/components/pos-types';

export default function KioskPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Failed to load menu items.');
        const data: MenuItem[] = await response.json();
        setItems(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load menu items.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => categorizeItem(item.name)));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => categorizeItem(item.name) === activeCategory);
  }, [items, activeCategory]);

  const addToCart = (customizedItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) =>
          i.menuid === customizedItem.menuid &&
          i.iceLevel === customizedItem.iceLevel &&
          i.sugarLevel === customizedItem.sugarLevel &&
          i.topping === customizedItem.topping
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...customizedItem, quantity: 1 }];
    });
    setSelectedItem(null);
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

      if (!response.ok) throw new Error('Failed to place order.');
      
      alert('Order Placed Successfully!');
      setCart([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#6f5848]">
        Preparing Menu...
      </div>
    );

  return (
    <main className="flex h-screen flex-col bg-[#fdfaf6] text-[#2f241d] lg:flex-row">
      <section className="flex flex-1 flex-col overflow-hidden border-r border-[#eadfce]">
        <header className="border-b border-[#eadfce] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">
                Kiosk Ordering
              </h1>
            </div>
            <div className="hidden sm:block">
              <span className="rounded-full bg-[#f8f1e7] px-4 py-2 text-sm font-medium text-[#8a6240]">
                Self Service
              </span>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat
                    ? 'bg-[#2f7a5f] text-white shadow-md'
                    : 'bg-[#f0e6d8] text-[#6f5848] hover:bg-[#e6d8c4]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <MenuGrid
            items={filteredItems}
            error={error}
            onSelectItem={setSelectedItem}
          />
        </div>
      </section>

      <CartSidebar
        cart={cart}
        onAdd={(item) => addToCart(item as CartItem)}
        onRemove={removeFromCart}
        onPlaceOrder={placeOrder}
        isPlacingOrder={isPlacingOrder}
      />

      {selectedItem && (
        <CustomizationModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onConfirm={addToCart}
        />
      )}
    </main>
  );
}
