// This file defines TypeScript types and utility functions related to the POS system, including menu items, cart items, and currency formatting.

import { categorizeMenuItem } from '@/lib/menu-categories';
import type { CupSize } from '@/lib/cup-sizes';

export type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
  image_url?: string;
  category_id?: number | null;
  category_label?: string | null;
  category_color?: string | null;
  stockStatus?: 'low' | 'out';
};

export type CartItem = MenuItem & {
  quantity: number;
  iceLevel?: string;
  sugarLevel?: string;
  topping?: string;
  temperature?: 'Hot' | 'Cold';
  cupSize?: CupSize;
};

export const COLD_ONLY_ITEMS = new Set<string>([]);
export const supportsHot = (name: string): boolean =>
  !COLD_ONLY_ITEMS.has(name);

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const categorizeItem = (
  item: string | Pick<MenuItem, 'name' | 'category_label'>
) => {
  if (typeof item !== 'string' && item.category_label) {
    return item.category_label;
  }

  const name = typeof item === 'string' ? item : item.name;
  return categorizeMenuItem(name)?.label ?? 'Other';
};

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'All':
      return 'Menu';
    case 'Milk Teas':
      return 'Cloud';
    case 'Fruit Teas':
      return 'Sparkle';
    case 'Green & Oolong Teas':
      return 'Leaf';
    default:
      return 'Star';
  }
};

export const getItemBadge = (name: string) => {
  const n = name.toLowerCase();

  if (n.includes('matcha')) return 'Signature';
  if (n.includes('brown sugar') || n.includes('boba')) return 'Popular';
  if (n.includes('strawberry') || n.includes('mango')) return 'Bright';
  if (n.includes('cake') || n.includes('snack')) return 'Pairing';

  return null;
};

export const getStockStatusLabel = (status?: MenuItem['stockStatus']) => {
  if (status === 'out') return 'Out of Stock';
  if (status === 'low') return 'Low Stock';
  return null;
};

export const getItemDescription = (name: string) => {
  const n = name.toLowerCase();

  if (n.includes('matcha')) return 'Stone-ground green tea with a smooth, mellow finish.';
  if (n.includes('latte') || n.includes('milk')) return 'Creamy, comforting, and built for easy customization.';
  if (n.includes('tea')) return 'Fresh brewed and balanced for a clean, bright sip.';
  if (n.includes('cake') || n.includes('snack')) return 'A sweet café side that rounds out the order.';

  return 'A house favorite with a polished café-style presentation.';
};
