// This file defines TypeScript types and utility functions related to the POS system, including menu items, cart items, and currency formatting.

import { MENU_CATEGORY_LABELS, categorizeMenuItem } from '@/lib/menu-categories';
import type { CupSize } from '@/lib/cup-sizes';

export type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
  image_url?: string;
  category_id?: number | null;
  category_label?: string | null;
  category_color?: string | null;
  category_display_order?: number | null;
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

export const getCategoryDisplayOrder = (
  item: string | Pick<MenuItem, 'name' | 'category_label' | 'category_display_order'>
) => {
  if (
    typeof item !== 'string' &&
    item.category_label &&
    typeof item.category_display_order === 'number'
  ) {
    return item.category_display_order;
  }

  const name = typeof item === 'string' ? item : item.name;
  const fallbackCategory = categorizeMenuItem(name);
  const fallbackIndex = fallbackCategory
    ? MENU_CATEGORY_LABELS.indexOf(fallbackCategory.label)
    : -1;

  return fallbackIndex === -1 ? Number.MAX_SAFE_INTEGER : 1000 + fallbackIndex;
};

export const getOrderedCategories = (items: MenuItem[]) => {
  const categoriesByLabel = new Map<string, number>();

  for (const item of items) {
    const label = categorizeItem(item);
    const order = getCategoryDisplayOrder(item);
    const currentOrder = categoriesByLabel.get(label);

    if (currentOrder === undefined || order < currentOrder) {
      categoriesByLabel.set(label, order);
    }
  }

  const itemCategories = Array.from(categoriesByLabel, ([label, order]) => ({
    label,
    order,
  })).sort(
    (first, second) =>
      first.order - second.order || first.label.localeCompare(second.label)
  );

  return ['All', ...itemCategories.map((category) => category.label)];
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
