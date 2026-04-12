// This file defines TypeScript types and utility functions related to the POS system, including menu items, cart items, and currency formatting.

export type MenuItem = {
  menuid: number;
  name: string;
  cost: number;
  image_url?: string;
};

export type CartItem = MenuItem & {
  quantity: number;
  iceLevel?: string;
  sugarLevel?: string;
  topping?: string;
};

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export const categorizeItem = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('latte') || n.includes('milk')) return 'Lattes & Milk';
  if (n.includes('tea') || n.includes('matcha')) return 'Tea & Matcha';
  if (n.includes('snack') || n.includes('food') || n.includes('cake')) return 'Treats';
  return 'Specials';
};