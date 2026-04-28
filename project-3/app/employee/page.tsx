'use client';

import { useEffect, useMemo, useState } from 'react';
import MenuGrid2 from '@/components/MenuGrid2';
import CartSidebar from '@/components/CartSidebar';
import CustomizationModal from '@/components/CustomizationModal';
import AuthGuard from '@/components/AuthGuard';
import AssistantWidget from '@/components/AssistantWidget';
import OrderUnavailableModal, {
  type UnavailableOrderItem,
} from '@/components/OrderUnavailableModal';
import { authFetch } from '@/lib/fetch-utils';
import { useRouter } from 'next/navigation';
import {
  categorizeItem,
  type MenuItem,
  type CartItem,
} from '@/components/pos-types';
import { MENU_CATEGORY_LABELS } from '@/lib/menu-categories';

type ModalState =
  | { mode: 'add'; item: MenuItem }
  | { mode: 'edit'; item: CartItem; index: number };

const hasSameCustomization = (first: CartItem, second: CartItem) =>
  first.menuid === second.menuid &&
  first.iceLevel === second.iceLevel &&
  first.sugarLevel === second.sugarLevel &&
  first.topping === second.topping &&
  (first.cupSize ?? 'Medium') === (second.cupSize ?? 'Medium');

/**
 * Sub-component that handles POS logic. 
 * Only rendered once AuthGuard confirms the user is authenticated.
 */
function EmployeePOSContent() {
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<number | null>(null);
  const [unavailableItems, setUnavailableItems] = useState<UnavailableOrderItem[] | null>(null);

  useEffect(() => {
    // Capture user role for conditional UI
    setUserRole(localStorage.getItem('user_role'));

    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1])) as {
          employeeId?: number | null;
        };
        setCurrentEmployeeId(payload.employeeId ?? null);
      } catch {
        setCurrentEmployeeId(null);
      }
    }

    async function loadData() {
      try {
        // Fetch Menu (Public)
        const menuRes = await fetch('/api/menu');
        if (!menuRes.ok) throw new Error('Failed to load menu items.');
        const menuData = await menuRes.json();
        setItems(menuData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [router]);

  const categories = useMemo(() => {
    const itemCategories = new Set(items.map((item) => categorizeItem(item.name)));
    return ['All', ...MENU_CATEGORY_LABELS.filter((category) => itemCategories.has(category))];
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

  const removeFromCart = (index: number) => {
    setCart((prev) => {
      if (index === -1) return prev;
      
      const item = prev[index];
      if (!item) return prev;
      if (item.quantity > 1) {
        return prev.map((i, idx) =>
          idx === index ? { ...i, quantity: i.quantity - 1 } : i
        );
      }
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
  const costTotal = subtotal * 1.0825;

  const handlePlaceOrder = async () => {
    if (!currentEmployeeId) {
      alert('No employee record is linked to this account. Ask a manager to set up your employee profile.');
      return;
    }
    setIsPlacingOrder(true);
    try {
      const response = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeID: currentEmployeeId,
          customerName: customerName.trim() || null,
          costTotal: Math.round(costTotal * 100) / 100,
          items: cart.map((item) => ({
            menuid: item.menuid,
            quantity: item.quantity,
            cost: item.cost,
            iceLevel: item.iceLevel,
            sugarLevel: item.sugarLevel,
            topping: item.topping,
            cupSize: item.cupSize,
          })),
        }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
          unavailableItems?: UnavailableOrderItem[];
        };

        if (Array.isArray(data.unavailableItems) && data.unavailableItems.length > 0) {
          setUnavailableItems(data.unavailableItems);
          return;
        }

        throw new Error(data.error || 'Failed to place order.');
      }
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

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    router.push('/login');
  };

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdfaf6] text-[#6f5848]">
        Preparing POS...
      </div>
    );

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdfaf6] p-4 text-center">
        <div className="rounded-2xl bg-white p-8 shadow-xl border border-red-100 max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#2f7a5f] text-white rounded-full font-semibold shadow-md hover:bg-[#256650] transition-colors"
            >
              Retry
            </button>
            <button 
              onClick={handleLogout}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            {userRole === 'manager' && (
                <button
                  onClick={() => router.push('/manager')}
                  className="rounded-xl border border-[#2f7a5f] text-[#2f7a5f] px-4 py-2 text-sm font-semibold hover:bg-[#2f7a5f] hover:text-white transition-all shadow-sm"
                >
                  Manager View
                </button>
              )}
              <button
                onClick={handleLogout}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
              >
                Logout
              </button>
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
          <MenuGrid2
            items={filteredItems}
            error={error}
            onSelectItem={(item) => setModalState({ mode: 'add', item })}
          />
        </div>
      </section>

      <CartSidebar
        cart={cart}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onPlaceOrder={handlePlaceOrder}
        isPlacingOrder={isPlacingOrder}
        onEditItem={(index) => {
          const item = cart[index];
          if (!item) return;

          setModalState({ mode: 'edit', item, index });
        }}
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
          initialCupSize={
            modalState.mode === 'edit' ? modalState.item.cupSize : undefined
          }
          confirmLabel={
            modalState.mode === 'edit' ? 'Save Changes' : 'Add to Order'
          }
          showDialogImage={false}
        />
      )}

      {unavailableItems && (
        <OrderUnavailableModal
          items={unavailableItems}
          onClose={() => setUnavailableItems(null)}
        />
      )}

      <AssistantWidget onAddToCart={addToCart} />
    </main>
  );
}

export default function EmployeePOSPage() {
  return (
    <AuthGuard allowedRoles={['employee', 'manager']}>
      <EmployeePOSContent />
    </AuthGuard>
  );
}
