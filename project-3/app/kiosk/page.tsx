'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import MenuGrid from '@/components/MenuGrid';
import CartSidebar from '@/components/CartSidebar';
import { categorizeItem, type MenuItem, type CartItem } from '@/components/pos-types';

export default function KioskPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Failed to load menu items.');
        const data: MenuItem[] = await response.json();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load menu items.');
      } finally {
        setIsLoading(false);
      }
    }
    loadMenu();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map(item => categorizeItem(item.name)));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter(item => categorizeItem(item.name) === activeCategory);
  }, [items, activeCategory]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuid === item.menuid);
      if (existing) {
        return prev.map(i => i.menuid === item.menuid ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (menuid: number) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuid === menuid);
      if (existing && existing.quantity > 1) {
        return prev.map(i => i.menuid === menuid ? { ...i, quantity: i.quantity - 1 } : i);
      }
      return prev.filter(i => i.menuid !== menuid);
    });
  };

  if (isLoading) return (
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
              <Link href="/" className="text-xs font-bold uppercase tracking-widest text-[#8a6240] hover:underline">
                ← Portal
              </Link>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Kiosk Ordering</h1>
            </div>
            <div className="hidden sm:block">
              <span className="rounded-full bg-[#f8f1e7] px-4 py-2 text-sm font-medium text-[#8a6240]">
                Self Service
              </span>
            </div>
          </div>

          <MenuGrid
            items={filteredItems}
            error={error}
            activeCategory={activeCategory}
            categories={categories}
            onCategoryChange={setActiveCategory}
            onAddToCart={addToCart}
          />
        </header>
      </section>

      <CartSidebar
        cart={cart}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onPlaceOrder={() => alert('Order Placed Successfully!')}
      />
    </main>
  );
}