'use client';

import { useEffect, useMemo, useState } from 'react';
import MenuGrid from '@/components/MenuGrid';
import CartSidebar from '@/components/CartSidebar';
import {
  categorizeItem,
  type MenuItem,
  type CartItem,
} from '@/components/pos-types';

type Employee = {
  employeeid: number;
  name: string;
};

export default function EmployeePOSPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [customerName, setCustomerName] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);

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

  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) throw new Error('Failed to load employees.');
        const data: Employee[] = await response.json();
        setEmployees(data);
      } catch {
        console.error('Failed to load employees');
      }
    }
    loadEmployees();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => categorizeItem(item.name)));
    return ['All', ...Array.from(cats)];
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => categorizeItem(item.name) === activeCategory);
  }, [items, activeCategory]);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuid === item.menuid);
      if (existing) {
        return prev.map((i) =>
          i.menuid === item.menuid ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (menuid: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuid === menuid);
      if (existing && existing.quantity > 1) {
        return prev.map((i) =>
          i.menuid === menuid ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((i) => i.menuid !== menuid);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
  const costTotal = subtotal * 1.0825;

  const handlePlaceOrder = async () => {
    if (!selectedEmployeeId) {
      alert('Please select an employee before placing an order.');
      return;
    }
    setIsPlacingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeID: selectedEmployeeId,
          customerName: customerName.trim() || null,
          costTotal: Math.round(costTotal * 100) / 100,
          items: cart.map((item) => ({
            menuid: item.menuid,
            quantity: item.quantity,
            cost: item.cost,
          })),
        }),
      });
      if (!response.ok) throw new Error('Failed to place order.');
      const order = await response.json();
      setOrderSuccess(order.orderid);
      setCart([]);
      setCustomerName('');
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
                Cashier POS
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedEmployeeId ?? ''}
                onChange={(e) =>
                  setSelectedEmployeeId(Number(e.target.value) || null)
                }
                className="rounded-xl border border-[#eadfce] bg-[#f8f1e7] px-4 py-2 text-sm font-semibold text-[#2f241d] focus:outline-none focus:ring-2 focus:ring-[#2f7a5f]"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.employeeid} value={emp.employeeid}>
                    {emp.name}
                  </option>
                ))}
              </select>
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
            onAddToCart={addToCart}
          />
        </div>
      </section>

      <CartSidebar
        cart={cart}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        isPlacingOrder={isPlacingOrder}
        extraFields={
          <div className="space-y-3 pb-2">
            {orderSuccess && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                Order #{orderSuccess} placed successfully!
              </div>
            )}
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#8a6240]">
                Customer Name
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-xl border border-[#eadfce] bg-white px-4 py-2 text-sm text-[#2f241d] placeholder-[#b8a898] focus:outline-none focus:ring-2 focus:ring-[#2f7a5f]"
              />
            </div>
          </div>
        }
      />
    </main>
  );
}
