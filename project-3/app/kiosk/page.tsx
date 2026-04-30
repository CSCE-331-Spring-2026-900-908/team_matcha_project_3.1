'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import MenuGrid from '@/components/MenuGrid';
import CartSidebar from '@/components/CartSidebar';
import CustomizationModal from '@/components/CustomizationModal';
import AssistantWidget from '@/components/AssistantWidget';
import OrderUnavailableModal, {
  type UnavailableOrderItem,
} from '@/components/OrderUnavailableModal';
import {
  categorizeItem,
  currencyFormatter,
  getCategoryIcon,
  getItemDescription,
  getOrderedCategories,
  getItemBadge,
  type MenuItem,
  type CartItem,
} from '@/components/pos-types';
import {
  getWeatherRecommendationMeta,
  pickWeatherRecommendedItem,
  type WeatherRecommendationIcon,
} from '@/lib/weather';

type GoogleAccountsApi = {
  id: {
    initialize: (options: {
      client_id: string | undefined;
      callback: (response: { credential: string }) => void;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: {
        theme: string;
        size: string;
        text: string;
      }
    ) => void;
    prompt: () => void;
  };
};

type KioskUser = {
  userId: number;
  name: string;
  email: string;
};



type ModalState =
  | { mode: 'add'; item: MenuItem }
  | { mode: 'edit'; item: CartItem; index: number };

type WeatherApiResponse = {
  location?: {
    label?: string;
  };
  current: {
    temperatureF: number | null;
    windMph: number | null;
    weatherCode: number | null;
    condition: string;
  };
};

const hasSameCustomization = (first: CartItem, second: CartItem) =>
  first.menuid === second.menuid &&
  first.iceLevel === second.iceLevel &&
  first.sugarLevel === second.sugarLevel &&
  first.topping === second.topping &&
  (first.cupSize ?? 'Medium') === (second.cupSize ?? 'Medium');

const isSeasonalCategoryItem = (item: MenuItem) =>
  (item.category_label ?? '').toLowerCase().includes('seasonal');

function CategoryIcon({ iconName }: { iconName: string }) {
  switch (iconName) {
    case 'Leaf':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 21c8 0 14-6 14-14C11 7 5 13 5 21Z" />
          <path d="M9 15c2 0 4-2 6-6" />
        </svg>
      );
    case 'Cloud':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18h11a4 4 0 1 0-.7-7.94A5 5 0 0 0 6.4 8.6 3.5 3.5 0 0 0 6 18Z" />
        </svg>
      );
    case 'Sparkle':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
        </svg>
      );
    case 'Star':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" />
        </svg>
      );
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 7h16M4 12h16M4 17h10" />
        </svg>
      );
  }
}

function WeatherGlyph({ iconName }: { iconName: WeatherRecommendationIcon }) {
  switch (iconName) {
    case 'Sun':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
        </svg>
      );
    case 'CloudRain':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 15.5h10.5a3.5 3.5 0 1 0-.61-6.95A4.5 4.5 0 0 0 7 7.75a3.25 3.25 0 0 0-1 7.75Z" />
          <path d="M9 18.5 8 21M13 18.5 12 21M17 18.5 16 21" />
        </svg>
      );
    case 'CloudSnow':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 15.5h10.5a3.5 3.5 0 1 0-.61-6.95A4.5 4.5 0 0 0 7 7.75a3.25 3.25 0 0 0-1 7.75Z" />
          <path d="m8.5 18.5 1 1m0-1-1 1M12.5 18.5l1 1m0-1-1 1M16.5 18.5l1 1m0-1-1 1" />
        </svg>
      );
    case 'Cloud':
    default:
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18h11a4 4 0 1 0-.7-7.94A5 5 0 0 0 6.4 8.6 3.5 3.5 0 0 0 6 18Z" />
        </svg>
      );
  }
}

export default function KioskPage() {
  console.log('[KioskPage] Rendering');
  const [kioskUser, setKioskUser] = useState<KioskUser | null>(null);
  const [points, setPoints] = useState(0);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [googleScriptReady, setGoogleScriptReady] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [modalState, setModalState] = useState<ModalState | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherApiResponse | null>(null);
  const [seasonalIndex, setSeasonalIndex] = useState(0);
  const [isBrewing, setIsBrewing] = useState(false);
  const [animateCartBadge, setAnimateCartBadge] = useState(false);
  const [redeemConfirmOpen, setRedeemConfirmOpen] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [unavailableItems, setUnavailableItems] = useState<UnavailableOrderItem[] | null>(null);

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

  useEffect(() => {
    let isMounted = true;

    async function loadWeather() {
      try {
        const response = await fetch('/api/weather');
        if (!response.ok) return;

        const data = (await response.json()) as WeatherApiResponse;
        if (isMounted) {
          setWeather(data);
        }
      } catch {
        if (isMounted) {
          setWeather(null);
        }
      }
    }

    loadWeather();

    return () => {
      isMounted = false;
    };
  }, []);

  

  useEffect(() => {
    // Load Google Sign-In script
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    ) as HTMLScriptElement | null;

    const handleReady = () => {
      const googleAccounts = (window as Window & {
        google?: { accounts?: GoogleAccountsApi };
      }).google?.accounts;
      if (googleAccounts?.id) {
        setGoogleScriptReady(true);
      }
    };

    if (existingScript) {
      const googleAccounts = (window as Window & {
        google?: { accounts?: GoogleAccountsApi };
      }).google?.accounts;
      if (googleAccounts?.id) {
        setGoogleScriptReady(true);
      } else {
        existingScript.addEventListener('load', handleReady);
      }

      return () => {
        existingScript.removeEventListener('load', handleReady);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.addEventListener('load', handleReady);
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleReady);
    };
  }, []);

useEffect(() => {
  const googleAccounts = (window as Window & {
    google?: { accounts?: GoogleAccountsApi };
  }).google?.accounts;

  if (isLoading || !googleScriptReady || kioskUser || !googleAccounts?.id) return;

  const handleCredentialResponse = async (response: { credential: string }) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: response.credential, source: 'kiosk' }),
      });

      if (!res.ok) return;

      const data = await res.json();

      // Store token exactly like the login page does
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user_role', data.user.role);
      localStorage.setItem('user_name', data.user.name);

      // Decode userId from JWT (middle base64 segment)
      const payload = JSON.parse(atob(data.token.split('.')[1]));

      setKioskUser({
        userId: payload.userId,
        name: data.user.name,
        email: data.user.email,
      });
    } catch (err) {
      console.error('Kiosk sign-in error:', err);
    }
  };

  googleAccounts.id.initialize({
    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    callback: handleCredentialResponse,
  });

  const googleButtonContainer = document.getElementById('kioskGoogleBtn');
  if (googleButtonContainer) {
    googleButtonContainer.innerHTML = '';
    googleAccounts.id.renderButton(googleButtonContainer, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
    });
  }
}, [googleScriptReady, kioskUser, isLoading]);

useEffect(() => {
  if (!kioskUser) return;

  async function loadPoints() {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await fetch('/api/rewards', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setPoints(data.points ?? 0);
    } catch {
      // non-critical — silently ignore
    }
  }

  loadPoints();
}, [kioskUser]);

  const categories = useMemo(() => {
    return getOrderedCategories(items);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeCategory === 'All') return items;
    return items.filter((item) => categorizeItem(item) === activeCategory);
  }, [items, activeCategory]);

  const weatherRecommendation = useMemo(
    () => getWeatherRecommendationMeta(weather),
    [weather]
  );

  const featuredItem = useMemo(
    () => pickWeatherRecommendedItem(items, weather),
    [items, weather]
  );

  const seasonalItems = useMemo(() => {
    return items.filter(isSeasonalCategoryItem);
  }, [items]);

  const seasonalItem = useMemo(
    () =>
      seasonalItems.length > 0
        ? (seasonalItems[seasonalIndex % seasonalItems.length] ?? null)
        : null,
    [seasonalIndex, seasonalItems]
  );

  useEffect(() => {
    setSeasonalIndex(0);
  }, [seasonalItems]);

  useEffect(() => {
    if (seasonalItems.length <= 1) return;

    const timer = window.setInterval(() => {
      setSeasonalIndex((currentIndex) => (currentIndex + 1) % seasonalItems.length);
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [seasonalItems]);

  const subtotalForDisplay = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
  const cartTotal = Math.max(0, subtotalForDisplay - discountAmount) * 1.0825;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const weatherSummary =
    weather && typeof weather.current.temperatureF === 'number'
      ? `${Math.round(weather.current.temperatureF)}°F • ${weather.current.condition}`
      : 'Using house recommendation';

  const closeModal = () => setModalState(null);

  const addToCart = (customizedItem: CartItem) => {
    try {
      console.log('[addToCart] Called with item:', customizedItem);
      console.log('[addToCart] customizedItem type:', typeof customizedItem, 'keys:', customizedItem ? Object.keys(customizedItem) : 'null');
      
      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => hasSameCustomization(item, customizedItem));
        console.log('[addToCart] existing cart:', prev);
        console.log('[addToCart] matching index:', existingIndex);

        if (existingIndex !== -1) {
          console.log('[addToCart] Found match, incrementing quantity');
          return prev.map((item, index) =>
            index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
          );
        }

        console.log('[addToCart] No match, adding as new item with quantity 1');
        return [...prev, { ...customizedItem, quantity: 1 }];
      });
      setAnimateCartBadge(true);
      console.log('[addToCart] Cart state updated and badge animation triggered');
      closeModal();
    } catch (error) {
      console.error('[addToCart] ERROR:', error);
    }
  };

  useEffect(() => {
    if (!animateCartBadge) return;

    const timer = window.setTimeout(() => {
      setAnimateCartBadge(false);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [animateCartBadge]);

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

// Opens the warning modal — no API call yet
const handleRedeem = () => {
  if (points < 50) return;
  if (cart.length === 0) {
    alert('Please add a drink to your order first.');
    return;
  }
  setRedeemConfirmOpen(true);
};

// Called when customer confirms in the modal
const confirmRedeem = async () => {
  setRedeemConfirmOpen(false);
  setIsRedeeming(true);
  const token = localStorage.getItem('auth_token');
  try {
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error ?? 'Could not redeem points.');
      return;
    }
    const data = await res.json();
    setPoints(data.points);

    // Find the most expensive item (cost per unit, not total)
    const mostExpensive = cart.reduce((max, item) =>
      item.cost > max.cost ? item : max
    , cart[0]);
    setDiscountAmount(mostExpensive.cost);

    setRedeemSuccess(true);
    window.setTimeout(() => setRedeemSuccess(false), 3000);
  } catch {
    alert('Failed to redeem points.');
  } finally {
    setIsRedeeming(false);
  }
};

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);
    try {
      const subtotal = cart.reduce((acc, item) => acc + item.cost * item.quantity, 0);
      const discounted = Math.max(0, subtotal - discountAmount);
      const costTotal = discounted * 1.0825;

const token = localStorage.getItem('auth_token');
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
  body: JSON.stringify({
    customerName: kioskUser?.name ?? 'Kiosk Customer',
    costTotal,
    employeeID: 1,
    userId: kioskUser?.userId ?? null,
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
          setIsCartOpen(true);
          return;
        }

        throw new Error(data.error || 'Failed to place order.');
      }
      setIsBrewing(true);
      // Refresh points after successful order
if (kioskUser) {
  const token = localStorage.getItem('auth_token');
  const pointsRes = await fetch('/api/rewards', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (pointsRes.ok) {
    const pointsData = await pointsRes.json();
    setPoints(pointsData.points ?? 0);
  }
}
    window.setTimeout(() => {
      setIsBrewing(false);
      setCart([]);
      setIsCartOpen(false);
      setDiscountAmount(0);  
    }, 2200);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <main className="matcha-surface min-h-screen px-6 py-6 text-[#4a554a]">
        <div className="mx-auto max-w-[1600px]">
          <div className="mb-6 flex items-center justify-between">
            <div className="skeleton-shimmer h-14 w-64 rounded-full" />
            <div className="skeleton-shimmer hidden h-12 w-40 rounded-full sm:block" />
          </div>
          <div className="skeleton-shimmer mb-6 h-14 rounded-[24px]" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <div className="rounded-[32px] border border-[#e8e2d7] bg-white/70 p-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="skeleton-shimmer h-[320px] rounded-[28px]" />
                    <div className="skeleton-shimmer h-[320px] rounded-[28px]" />
                  </div>
                  <div className="grid gap-4">
                    <div className="skeleton-shimmer h-40 rounded-[28px]" />
                    <div className="skeleton-shimmer h-40 rounded-[28px]" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="overflow-hidden rounded-[28px] border border-[#eadfce] bg-white p-0 shadow-sm">
                    <div className="skeleton-shimmer h-56 w-full" />
                    <div className="space-y-4 p-6">
                      <div className="skeleton-shimmer h-5 w-24 rounded-full" />
                      <div className="skeleton-shimmer h-8 w-2/3 rounded-full" />
                      <div className="skeleton-shimmer h-4 w-full rounded-full" />
                      <div className="skeleton-shimmer h-4 w-4/5 rounded-full" />
                      <div className="flex items-center justify-between pt-4">
                        <div className="skeleton-shimmer h-12 w-28 rounded-full" />
                        <div className="skeleton-shimmer h-12 w-36 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="rounded-[32px] border border-[#eadfce] bg-white/80 p-8 shadow-sm">
                <div className="skeleton-shimmer h-8 w-36 rounded-full" />
                <div className="mt-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="skeleton-shimmer h-24 rounded-[24px]" />
                  ))}
                </div>
                <div className="mt-6 space-y-3">
                  <div className="skeleton-shimmer h-5 rounded-full" />
                  <div className="skeleton-shimmer h-5 rounded-full" />
                  <div className="skeleton-shimmer h-14 rounded-[24px]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="matcha-surface flex h-screen flex-col text-[#1f2520] lg:flex-row" aria-labelledby="kiosk-page-title">
      <section className="flex flex-1 flex-col overflow-hidden border-r border-[#eadfce]" aria-label="Ordering area">
        <header className="border-b border-[#eadfce] bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* <Link
                href="/"
                className="flex h-12 items-center justify-center rounded-full bg-[#f8f1e7] px-5 text-base font-bold text-[#4a554a] transition-all hover:bg-[#e6d8c4] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
                aria-label="Back to Portal"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" className="mr-2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Portal
              </Link> */}
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6d8a6f]">
                  Self Service
                </p>
                <h1 id="kiosk-page-title" className="text-3xl font-extrabold tracking-tight text-[#1f2520] lg:text-4xl">
                  Kiosk Ordering
                </h1>
              </div>
              
            </div>
          </div>

          <nav className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between" aria-label="Menu categories and rewards">
            <div className="flex gap-3 overflow-x-auto pb-2 xl:flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  aria-pressed={activeCategory === cat}
                  className={`inline-flex min-h-[56px] shrink-0 items-center gap-3 whitespace-nowrap rounded-full px-6 py-2 text-base font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#2f7a5f] ${
                    activeCategory === cat
                      ? 'bg-[#2f7a5f] text-white shadow-md shadow-[#2f7a5f]/20'
                      : 'bg-[#f8f1e7] text-[#4a554a] hover:bg-[#e6d8c4]'
                  }`}
                >
                  {cat === 'All' ? (
                    <span aria-hidden="true">
                      <CategoryIcon iconName={getCategoryIcon(cat)} />
                    </span>
                  ) : null}
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center xl:justify-end">
              {kioskUser ? (
                <div className="flex items-center gap-3 rounded-[20px] border border-[#dce5d8] bg-[#eef1ec] px-5 py-2.5 shadow-sm">
                  <span className="text-xl">🏆</span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6d8a6f]">
                      {kioskUser.name.split(' ')[0]}
                    </p>
                    <p className="text-base font-extrabold text-[#2f7a5f]">
                      {points} pts
                      {points >= 50 && (
                        <button
                          onClick={handleRedeem}
                          disabled={isRedeeming}
                          className="ml-3 rounded-full bg-[#2f7a5f] px-3 py-0.5 text-xs font-bold text-white transition hover:bg-[#25614b] disabled:opacity-50"
                        >
                          {isRedeeming ? '...' : 'Redeem'}
                        </button>
                      )}
                    </p>
                    {redeemSuccess && (
                      <p className="text-xs font-bold text-[#2f7a5f]">✓ Free drink redeemed!</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[44px] items-center">
                  <div
                    id="kioskGoogleBtn"
                    aria-label="Sign in for rewards with Google"
                    className={googleScriptReady ? '' : 'min-w-[240px] min-h-[40px] rounded-full bg-[#f8f1e7]'}
                  />
                </div>
              )}
            </div>
          </nav>
        </header>

<div id="main-content" className="flex-1 overflow-y-auto bg-[linear-gradient(135deg,#f5ede0_0%,#e8d5b8_50%,#dfc9a5_100%)] px-6 pb-32 pt-6 lg:pb-6">          <section className="matcha-grid mb-6 grid gap-4 rounded-[32px] border border-[#e8e2d7] bg-[linear-gradient(135deg,#fffdf9_0%,#eef1ec_100%)] p-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]" aria-labelledby="featured-drink-title">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <section className="rounded-[28px] bg-[#1f2520] px-6 py-6 text-white shadow-[0_18px_44px_rgba(31,37,32,0.18)]" aria-describedby="featured-drink-copy">
                <button
                  type="button"
                  onClick={() => {
                    if (!featuredItem) return;
                    setModalState({ mode: 'add', item: featuredItem });
                  }}
                  disabled={!featuredItem}
                  className="w-full text-left transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-white/60 disabled:cursor-default disabled:opacity-100"
                  aria-label={
                    featuredItem
                      ? `Customize ${featuredItem.name}`
                      : 'No weather recommendation available'
                  }
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#dcefe4]">
                      <WeatherGlyph iconName={weatherRecommendation.icon} />
                      {weatherRecommendation.label}
                    </span>
                    {featuredItem && getItemBadge(featuredItem.name) ? (
                      <span className="rounded-full bg-[#d9b16f] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#1f2520]">
                        {getItemBadge(featuredItem.name)}
                      </span>
                    ) : null}
                  </div>
                  <h2 id="featured-drink-title" className="mt-4 max-w-xl text-3xl font-bold leading-tight lg:text-4xl">
                    {featuredItem ? featuredItem.name : 'Fresh whisked matcha, ready in minutes.'}
                  </h2>
                  <p id="featured-drink-copy" className="mt-3 max-w-2xl text-base leading-7 text-white/82">
                    {weatherRecommendation.reason}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88">
                      {weatherSummary}
                    </span>
                    {weather?.location?.label ? (
                      <span className="rounded-full border border-white/18 bg-white/8 px-4 py-2 text-sm font-semibold text-white/88">
                        {weather.location.label}
                      </span>
                    ) : null}
                  </div>
                </button>
                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (!featuredItem) return;
                      setModalState({ mode: 'add', item: featuredItem });
                    }}
                    className="min-h-[56px] rounded-full bg-white px-6 py-3 text-base font-bold text-[#1f2520] transition hover:bg-[#eef1ec] focus:outline-none focus:ring-4 focus:ring-white/60"
                  >
                    Customize Recommended Drink
                  </button>
                  <div className="inline-flex min-h-[56px] items-center rounded-full border border-white/18 px-5 py-3 text-base font-semibold text-white/88">
                    {featuredItem ? currencyFormatter.format(featuredItem.cost) : 'Cafe favorites'}
                  </div>
                </div>
              </section>

              <aside className="overflow-hidden rounded-[28px] border border-[#d9e4da] bg-white shadow-[0_18px_44px_rgba(47,36,29,0.12)]" aria-label="Featured drink image">
                <button
                  type="button"
                  onClick={() => {
                    if (!featuredItem) return;
                    setModalState({ mode: 'add', item: featuredItem });
                  }}
                  disabled={!featuredItem}
                  className="block h-full w-full text-left transition hover:opacity-95 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2 disabled:cursor-default disabled:opacity-100"
                  aria-label={
                    featuredItem
                      ? `Customize ${featuredItem.name}`
                      : 'No weather recommendation available'
                  }
                >
                  <div className="relative h-full min-h-[260px] bg-[linear-gradient(180deg,#f8f1e7_0%,#eef1ec_100%)]">
                    {featuredItem?.image_url ? (
                      <img
                        src={featuredItem.image_url}
                        alt={featuredItem.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-8xl opacity-60" aria-hidden="true">
                        🍵
                      </div>
                    )}
                    <div className="contrast-image-overlay absolute inset-x-0 bottom-0 bg-[linear-gradient(180deg,transparent_0%,rgba(31,37,32,0.82)_100%)] p-5 text-white">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/72">
                        Weather Pick
                      </p>
                      <p className="mt-2 text-2xl font-bold">
                        {featuredItem ? featuredItem.name : 'House Favorite'}
                      </p>
                    </div>
                  </div>
                </button>
              </aside>
            </div>

            <div className="grid gap-4">
              <section
                className="rounded-[28px] border border-[#f0c85a] bg-[linear-gradient(135deg,#fff7d1_0%,#ffe79c_48%,#ffd76d_100%)] p-5 shadow-[0_12px_28px_rgba(185,134,18,0.18)]"
                aria-labelledby="seasonal-spotlight-title"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8d5d00]">
                      Summer Spotlight
                    </p>
                    <h3 id="seasonal-spotlight-title" className="mt-2 text-2xl font-bold text-[#3c2a03]">
                      Seasonal Drinks
                    </h3>
                  </div>
                  {seasonalItems.length > 1 ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setSeasonalIndex((currentIndex) =>
                            currentIndex === 0 ? seasonalItems.length - 1 : currentIndex - 1
                          )
                        }
                        className="grid h-10 w-10 place-items-center rounded-full border border-[#d8a82f] bg-white/70 text-[#8d5d00] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#f0c85a] focus:ring-offset-2 focus:ring-offset-[#ffe79c]"
                        aria-label="Show previous seasonal drink"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        onClick={() =>
                          setSeasonalIndex((currentIndex) => (currentIndex + 1) % seasonalItems.length)
                        }
                        className="grid h-10 w-10 place-items-center rounded-full border border-[#d8a82f] bg-white/70 text-[#8d5d00] transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-[#f0c85a] focus:ring-offset-2 focus:ring-offset-[#ffe79c]"
                        aria-label="Show next seasonal drink"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-[132px_minmax(0,1fr)]">
                  <button
                    type="button"
                    onClick={() => {
                      if (!seasonalItem) return;
                      setModalState({ mode: 'add', item: seasonalItem });
                    }}
                    disabled={!seasonalItem}
                    className="overflow-hidden rounded-[22px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.7)_0%,rgba(255,244,196,0.92)_100%)] text-left transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#f0c85a] focus:ring-offset-2 focus:ring-offset-[#ffe79c] disabled:cursor-default disabled:opacity-100"
                    aria-label={
                      seasonalItem
                        ? `Customize ${seasonalItem.name}`
                        : 'No seasonal drinks available'
                    }
                  >
                    {seasonalItem?.image_url ? (
                      <img
                        src={seasonalItem.image_url}
                        alt={seasonalItem.name}
                        className="h-full min-h-[132px] w-full object-cover"
                      />
                    ) : (
                      <div className="flex min-h-[132px] items-center justify-center text-5xl text-[#8d5d00]" aria-hidden="true">
                        *
                      </div>
                    )}
                  </button>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!seasonalItem) return;
                        setModalState({ mode: 'add', item: seasonalItem });
                      }}
                      disabled={!seasonalItem}
                      className="w-full text-left transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#f0c85a] focus:ring-offset-2 focus:ring-offset-[#ffe79c] disabled:cursor-default disabled:opacity-100"
                      aria-label={
                        seasonalItem
                          ? `Customize ${seasonalItem.name}`
                          : 'No seasonal drinks available'
                      }
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-white/70 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#8d5d00]">
                          {seasonalItems.length > 0
                            ? `${(seasonalIndex % seasonalItems.length) + 1} / ${seasonalItems.length}`
                            : 'Seasonal'}
                        </span>
                        {seasonalItem && getItemBadge(seasonalItem.name) ? (
                          <span className="rounded-full bg-[#f6c53c] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#4f3300]">
                            {getItemBadge(seasonalItem.name)}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="mt-3 text-2xl font-bold text-[#3c2a03]">
                        {seasonalItem ? seasonalItem.name : 'No Seasonal Drinks'}
                      </h4>
                      <p className="mt-2 text-sm leading-6 text-[#6c4a06]">
                        {seasonalItem
                          ? `${getItemDescription(seasonalItem.name)} Part of the rotating seasonal lineup.`
                          : 'Add items to the Seasonal category to show them in this spotlight.'}
                      </p>
                    </button>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {seasonalItem ? (
                        <span className="rounded-full bg-white/80 px-3 py-1.5 text-sm font-bold text-[#6c4a06]">
                          {currencyFormatter.format(seasonalItem.cost)}
                        </span>
                      ) : null}
                      {seasonalItem ? (
                        <button
                          onClick={() => {
                            setModalState({ mode: 'add', item: seasonalItem });
                          }}
                          className="min-h-[44px] rounded-full bg-[#5c3b00] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#472d00] focus:outline-none focus:ring-4 focus:ring-[#f0c85a] focus:ring-offset-2 focus:ring-offset-[#ffe79c]"
                        >
                          Customize This Seasonal Drink
                        </button>
                      ) : null}
                    </div>
                    {seasonalItems.length > 1 ? (
                      <div className="mt-4 flex gap-2" aria-hidden="true">
                        {seasonalItems.map((item, index) => (
                          <span
                            key={item.menuid}
                            className={`h-2.5 rounded-full transition-all ${
                              index === seasonalIndex % seasonalItems.length
                                ? 'w-8 bg-[#8d5d00]'
                                : 'w-2.5 bg-[#d6b154]'
                            }`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          </section>

          <section aria-labelledby="menu-section-title">
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6d8a6f]">
                Browse
              </p>
              <h2 id="menu-section-title" className="mt-2 text-3xl font-bold text-[#1f2520]">Drinks and Treats</h2>
            </div>
            <p className="text-sm text-[#4a554a]">
              {filteredItems.length} items in this section
            </p>
          </div>

          <div key={activeCategory} className="animate-fade-in-up">
            <MenuGrid
              items={filteredItems}
              error={error}
              onSelectItem={(item) => setModalState({ mode: 'add', item })}
              showAddIcon={false}
            />
          </div>
          </section>
        </div>
      </section>

      <div className="hidden lg:flex lg:self-stretch">
        <CartSidebar
discountAmount={discountAmount}
extraFields={
  kioskUser ? (
    <div className="space-y-2 pb-1">
      {discountAmount > 0 && (
        <div className="flex items-center justify-between rounded-[14px] bg-[#eef1ec] px-4 py-3">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <p className="text-sm font-bold text-[#2f7a5f]">Rewards Discount</p>
          </div>
          <p className="text-sm font-bold text-[#2f7a5f]">
            -{currencyFormatter.format(discountAmount)}
          </p>
        </div>
      )}
      {points >= 50 && discountAmount === 0 ? (
        <button
          onClick={handleRedeem}
          disabled={isRedeeming}
          className="w-full min-h-[48px] rounded-[18px] border-2 border-[#2f7a5f] bg-[#eef1ec] px-4 py-2 text-sm font-bold text-[#2f7a5f] transition hover:bg-[#dde8df] disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
        >
          {isRedeeming ? 'Redeeming...' : `🎉 Redeem Free Drink (${points} pts)`}
        </button>
      ) : discountAmount === 0 ? (
        <div className="rounded-[14px] bg-[#f8f1e7] px-4 py-3 text-center">
          <p className="text-xs font-bold text-[#6d8a6f]">⭐ {points} / 50 pts</p>
          <p className="text-xs text-[#4a554a] mt-1">{50 - points} more points for a free drink</p>
        </div>
      ) : null}
      {redeemSuccess && (
        <p className="text-center text-xs font-bold text-[#2f7a5f]">✓ Free drink applied! Enjoy 🍵</p>
      )}
    </div>
  ) : undefined
}
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

      {cartItemCount > 0 && !isCartOpen && (
        <div className="fixed bottom-6 left-6 right-6 z-40 lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            disabled={cartItemCount === 0}
            className="flex w-full items-center justify-between rounded-[24px] bg-[#2f7a5f] p-5 text-white shadow-2xl shadow-[#2f7a5f]/40 transition-transform active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f] focus:ring-offset-2"
            aria-label={`View order. ${cartItemCount} items. Total ${currencyFormatter.format(cartTotal)}`}
          >
            <div className="flex items-center gap-4">
              <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-lg font-bold ${animateCartBadge ? 'animate-cart-bump' : ''}`}>
                {cartItemCount}
              </span>
              <span className="text-xl font-bold">View Order</span>
            </div>
            <span className="text-xl font-bold">
              {currencyFormatter.format(cartTotal)}
            </span>
          </button>
        </div>
      )}

      <CartSidebar
discountAmount={discountAmount}
extraFields={
  kioskUser ? (
    <div className="space-y-2 pb-1">
      {discountAmount > 0 && (
        <div className="flex items-center justify-between rounded-[14px] bg-[#eef1ec] px-4 py-3">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <p className="text-sm font-bold text-[#2f7a5f]">Rewards Discount</p>
          </div>
          <p className="text-sm font-bold text-[#2f7a5f]">
            -{currencyFormatter.format(discountAmount)}
          </p>
        </div>
      )}
      {points >= 50 && discountAmount === 0 ? (
        <button
          onClick={handleRedeem}
          disabled={isRedeeming}
          className="w-full min-h-[48px] rounded-[18px] border-2 border-[#2f7a5f] bg-[#eef1ec] px-4 py-2 text-sm font-bold text-[#2f7a5f] transition hover:bg-[#dde8df] disabled:opacity-50 focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
        >
          {isRedeeming ? 'Redeeming...' : `🎉 Redeem Free Drink (${points} pts)`}
        </button>
      ) : discountAmount === 0 ? (
        <div className="rounded-[14px] bg-[#f8f1e7] px-4 py-3 text-center">
          <p className="text-xs font-bold text-[#6d8a6f]">⭐ {points} / 50 pts</p>
          <p className="text-xs text-[#4a554a] mt-1">{50 - points} more points for a free drink</p>
        </div>
      ) : null}
      {redeemSuccess && (
        <p className="text-center text-xs font-bold text-[#2f7a5f]">✓ Free drink applied! Enjoy 🍵</p>
      )}
    </div>
  ) : undefined
}
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
          initialCupSize={
            modalState.mode === 'edit' ? modalState.item.cupSize : undefined
          }
          confirmLabel={
            modalState.mode === 'edit' ? 'Save Changes' : 'Add to Order'
          }
          presentation="fullscreen"
        />
      )}
{/* Redeem confirmation modal */}
{redeemConfirmOpen && (() => {
  const mostExpensive = cart.length > 0
    ? cart.reduce((max, item) => item.cost > max.cost ? item : max, cart[0])
    : null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1f2520]/60 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[32px] border border-[#e8e2d7] bg-white p-8 text-center shadow-[0_30px_80px_rgba(31,37,32,0.2)]">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eef1ec] text-3xl">
          🏆
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6d8a6f]">Redeem Reward</p>
        <h2 className="mt-3 text-2xl font-extrabold text-[#1f2520]">Use 50 points?</h2>
        <p className="mt-3 text-sm leading-6 text-[#4a554a]">
          Your most expensive drink will be free:
        </p>
        {mostExpensive && (
          <div className="mt-4 rounded-[18px] border border-[#e8e2d7] bg-[#f8f1e7] px-5 py-3">
            <p className="font-bold text-[#1f2520]">{mostExpensive.name}</p>
            <p className="text-lg font-extrabold text-[#2f7a5f]">
              {currencyFormatter.format(mostExpensive.cost)} → FREE
            </p>
            {mostExpensive.quantity > 1 && (
              <p className="mt-1 text-xs text-[#6d8a6f]">
                Only one will be free — you have {mostExpensive.quantity} in your cart.
              </p>
            )}
          </div>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => setRedeemConfirmOpen(false)}
            className="flex-1 min-h-[48px] rounded-[18px] border border-[#e8e2d7] bg-[#f8f1e7] px-4 py-2 text-sm font-bold text-[#4a554a] transition hover:bg-[#efe3d0] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
          >
            Cancel
          </button>
          <button
            onClick={confirmRedeem}
            className="flex-1 min-h-[48px] rounded-[18px] bg-[#2f7a5f] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#25614b] focus:outline-none focus:ring-4 focus:ring-[#2f7a5f]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
})()}
      {isBrewing ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1f2520]/72 p-6 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="brewing-title" aria-describedby="brewing-copy">
          <div className="w-full max-w-md rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,#fffdf9_0%,#eef1ec_100%)] p-8 text-center shadow-[0_30px_80px_rgba(31,37,32,0.3)]">
            <div className="relative mx-auto flex h-40 w-40 items-end justify-center">
              <span className="animate-steam-rise absolute left-9 top-1 text-3xl text-[#6d8a6f]">~</span>
              <span className="animate-steam-rise absolute right-9 top-3 text-3xl text-[#6d8a6f]" style={{ animationDelay: '0.4s' }}>~</span>
              <span className="animate-steam-rise absolute top-0 text-4xl text-[#6d8a6f]" style={{ animationDelay: '0.2s' }}>~</span>
              <div className="relative flex h-32 w-24 items-end justify-center overflow-hidden rounded-[28px] border-4 border-[#2f7a5f] bg-white shadow-xl shadow-[#2f7a5f]/20">
                <div className="animate-brew-fill absolute inset-x-0 bottom-0 rounded-b-[22px] bg-[linear-gradient(180deg,#c78f54_0%,#8a5730_100%)]" />
                <div className="animate-brew-pulse relative z-10 mb-5 text-4xl">🍵</div>
              </div>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#6d8a6f]">Brewing</p>
            <h2 id="brewing-title" className="mt-3 text-3xl font-bold text-[#1f2520]">Preparing your order</h2>
            <p id="brewing-copy" className="mt-3 text-base leading-7 text-[#4a554a]">
              Your drinks are being whisked, shaken, and queued for pickup.
            </p>
            <div className="mt-6 overflow-hidden rounded-full bg-[#dce5d8]">
              <div className="animate-brew-fill h-3 rounded-full bg-[linear-gradient(90deg,#6d8a6f_0%,#2f7a5f_100%)]" />
            </div>
          </div>
        </div>
      ) : null}

      {unavailableItems && (
        <OrderUnavailableModal
          items={unavailableItems}
          showDetails={false}
          onClose={() => setUnavailableItems(null)}
        />
      )}

      <AssistantWidget onAddToCart={addToCart} />
    </main>
  );
}
