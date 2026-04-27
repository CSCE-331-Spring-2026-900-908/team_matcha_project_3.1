import { getInventoryItems } from '@/lib/inventory';
import { getMenuItems, type MenuItem } from '@/lib/menu';
import { MENU_EXTRAS } from '@/lib/menu-data';

export type AssistantCartItem = MenuItem & {
  quantity: number;
  iceLevel: string;
  sugarLevel: string;
  topping: string;
};

type MenuSearchResult = MenuItem & {
  description: string;
  tag: string | null;
};

const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%', '125%'];
const TOPPING_KEYWORDS = ['tapioca', 'boba', 'red bean', 'honey'];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9% ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreMenuMatch(item: MenuSearchResult, query: string) {
  const normalizedQuery = normalizeText(query);
  const haystack = normalizeText(`${item.name} ${item.description} ${item.tag ?? ''}`);
  const tokens = normalizedQuery.split(' ').filter(Boolean);

  if (!normalizedQuery) return 0;
  if (normalizeText(item.name) === normalizedQuery) return 100;
  if (normalizeText(item.name).includes(normalizedQuery)) return 80;
  if (haystack.includes(normalizedQuery)) return 65;

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 12 : 0), 0);
}

function withMenuDetails(item: MenuItem): MenuSearchResult {
  const extras = MENU_EXTRAS[item.name];

  return {
    ...item,
    description: extras?.description ?? 'A customizable Team Matcha menu item.',
    tag: extras?.tag ?? null,
  };
}

function pickClosest(value: string | undefined, options: string[], fallback: string) {
  if (!value) return fallback;

  const normalizedValue = normalizeText(value);
  const exactMatch = options.find((option) => normalizeText(option) === normalizedValue);
  if (exactMatch) return exactMatch;

  const partialMatch = options.find(
    (option) =>
      normalizeText(option).includes(normalizedValue) ||
      normalizedValue.includes(normalizeText(option))
  );

  return partialMatch ?? fallback;
}

export async function searchAssistantMenu(query: string) {
  const menu = (await getMenuItems()).map(withMenuDetails);

  return menu
    .map((item) => ({ item, score: scoreMenuMatch(item, query) }))
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score || first.item.name.localeCompare(second.item.name))
    .slice(0, 6)
    .map(({ item }) => item);
}

export async function getAssistantMenu() {
  const menu = await getMenuItems();
  return menu.map(withMenuDetails);
}

export async function getAssistantToppings() {
  try {
    const inventory = await getInventoryItems();
    const toppings = inventory
      .filter((item) => {
        const normalized = item.name.toLowerCase();
        return TOPPING_KEYWORDS.some((keyword) => normalized.includes(keyword));
      })
      .map((item) => ({ name: item.name, cost: item.cost }));

    if (toppings.length > 0) return toppings;
  } catch {
    // The assistant can still work if inventory is unavailable.
  }

  return [
    { name: 'Tapioca Pearls', cost: 0 },
    { name: 'Boba', cost: 0 },
    { name: 'Red Bean', cost: 0 },
    { name: 'Honey Boba', cost: 0 },
  ];
}

export async function createAssistantCartItems(input: {
  itemName: string;
  quantity?: number;
  iceLevel?: string;
  sugarLevel?: string;
  topping?: string;
}): Promise<{
  cartItems: AssistantCartItem[];
  matchedItem: MenuSearchResult | null;
  message: string;
}> {
  const matches = await searchAssistantMenu(input.itemName);
  const matchedItem = matches[0] ?? null;

  if (!matchedItem) {
    return {
      cartItems: [],
      matchedItem: null,
      message: `I could not find "${input.itemName}" on the menu.`,
    };
  }

  const quantity = Math.max(1, Math.min(8, Math.floor(Number(input.quantity) || 1)));
  const cartItem: AssistantCartItem = {
    menuid: matchedItem.menuid,
    name: matchedItem.name,
    cost: matchedItem.cost,
    image_url: matchedItem.image_url,
    quantity,
    iceLevel: pickClosest(input.iceLevel, ICE_LEVELS, 'Regular Ice'),
    sugarLevel: pickClosest(input.sugarLevel, SUGAR_LEVELS, '100%'),
    topping: input.topping?.trim() || 'None',
  };

  return {
    cartItems: [cartItem],
    matchedItem,
    message: `Added ${quantity} ${matchedItem.name} to the cart draft.`,
  };
}
