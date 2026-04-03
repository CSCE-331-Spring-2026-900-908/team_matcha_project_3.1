'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
};

type CartItem = MenuItem & {
  quantity: number;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const categorizeItem = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('latte') || n.includes('milk')) return 'Lattes & Milk';
  if (n.includes('tea') || n.includes('matcha')) return 'Tea & Matcha';
  if (n.includes('snack') || n.includes('food') || n.includes('cake')) return 'Treats';
  return 'Specials';
};

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

  const subtotal = cart.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#6f5848]">Preparing Menu...</div>;

  return (
    <main className="flex h-screen flex-col bg-[#fdfaf6] text-[#2f241d] lg:flex-row">
      <section className="flex flex-1 flex-col overflow-hidden border-r border-[#eadfce]">
        <header className="border-b border-[#eadfce] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-xs font-bold uppercase tracking-widest text-[#8a6240] hover:underline">← Portal</Link>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Kiosk Ordering</h1>
            </div>
            <div className="hidden sm:block">
              <span className="rounded-full bg-[#f8f1e7] px-4 py-2 text-sm font-medium text-[#8a6240]">Self Service</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition-all ${
                  activeCategory === cat 
                  ? "bg-[#2f7a5f] text-white shadow-md" 
                  : "bg-[#f0e6d8] text-[#6f5848] hover:bg-[#e6d8c4]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {error ? (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-red-700">{error}</div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map(item => (
                <button
                  key={item.menuid}
                  onClick={() => addToCart(item)}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-[#eadfce] bg-white transition-all hover:border-[#2f7a5f] hover:shadow-lg active:scale-95"
                >
                  <div className="h-32 w-full bg-[#f8f1e7] group-hover:bg-[#ecf4f0] transition-colors flex items-center justify-center text-4xl opacity-40">
                    🍵
                  </div>
                  <div className="flex flex-1 flex-col p-4 text-left">
                    <span className="text-xs font-bold uppercase text-[#8a6240] opacity-70">{categorizeItem(item.name)}</span>
                    <h3 className="mt-1 font-bold leading-tight text-[#2f241d]">{item.name}</h3>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <p className="text-lg font-bold text-[#2f7a5f]">{currencyFormatter.format(item.cost)}</p>
                      <div className="rounded-full bg-[#f8f1e7] p-1 text-[#2f7a5f] group-hover:bg-[#2f7a5f] group-hover:text-white transition-colors">
                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 6v12m-6-6h12"/></svg>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <aside className="flex w-full flex-col bg-white shadow-2xl lg:w-[400px]">
        <div className="flex items-center justify-between border-b border-[#eadfce] p-6">
          <h2 className="text-xl font-extrabold">Your Order</h2>
          <span className="rounded-full bg-[#2f7a5f] px-3 py-1 text-xs font-bold text-white">{totalItems} items</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="mt-12 text-center text-[#6f5848]">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#fdfaf6] text-4xl">🛒</div>
              <p className="font-medium">Your cart is empty.</p>
              <p className="mt-1 text-sm opacity-60">Tap an item to start ordering.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.menuid} className="flex items-center gap-4 rounded-xl border border-[#f0e6d8] bg-[#fdfaf6] p-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm leading-tight">{item.name}</h4>
                    <p className="text-[#2f7a5f] text-sm font-semibold">{currencyFormatter.format(item.cost)}</p>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border border-[#eadfce] bg-white p-1">
                    <button onClick={() => removeFromCart(item.menuid)} className="flex h-8 w-8 items-center justify-center text-[#8a6240] hover:text-red-600 transition-colors">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M18 12H6"/></svg>
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                    <button onClick={() => addToCart(item)} className="flex h-8 w-8 items-center justify-center text-[#2f7a5f]">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 6v12m-6-6h12"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[#eadfce] bg-[#fdfaf6] p-6 space-y-4">
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
            disabled={cart.length === 0}
            className="w-full rounded-2xl bg-[#2f7a5f] py-5 text-lg font-bold text-white shadow-xl shadow-[#2f7a5f]/20 transition-all hover:bg-[#25614b] active:scale-95 disabled:grayscale disabled:opacity-50"
            onClick={() => alert('Order Placed Successfully!')}
          >
            Place Order
          </button>
        </div>
      </aside>
    </main>
  );
}
