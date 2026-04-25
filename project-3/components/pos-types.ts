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

export const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'All':
      return 'Menu';
    case 'Lattes & Milk':
      return 'Cloud';
    case 'Tea & Matcha':
      return 'Leaf';
    case 'Treats':
      return 'Sparkle';
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

export const getItemDescription = (name: string) => {
  const n = name.toLowerCase();

  if (n.includes('matcha')) return 'Stone-ground green tea with a smooth, mellow finish.';
  if (n.includes('latte') || n.includes('milk')) return 'Creamy, comforting, and built for easy customization.';
  if (n.includes('tea')) return 'Fresh brewed and balanced for a clean, bright sip.';
  if (n.includes('cake') || n.includes('snack')) return 'A sweet café side that rounds out the order.';

  return 'A house favorite with a polished café-style presentation.';
};
