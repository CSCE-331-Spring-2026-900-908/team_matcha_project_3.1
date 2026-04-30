import { getInventoryItems } from '@/lib/inventory';
import { DEFAULT_CUP_SIZE, type CupSize } from '@/lib/cup-sizes';
import { getMenuItems, type MenuItem } from '@/lib/menu';
import { MENU_EXTRAS } from '@/lib/menu-data';
import {
  AVAILABLE_TOPPINGS,
  formatToppings,
  getToppingsCost,
  normalizeToppingName,
  TOPPING_COSTS,
} from '@/lib/toppings';
import { loadWeatherSnapshot } from '@/lib/weather';
import {
  getWeatherRecommendationMeta,
  pickWeatherRecommendedItem,
} from '@/lib/weather-recommendation';

export type AssistantCartItem = MenuItem & {
  quantity: number;
  iceLevel: string;
  sugarLevel: string;
  topping: string;
  cupSize: CupSize;
};

type MenuSearchResult = MenuItem & {
  description: string;
  tag: string | null;
};

const ICE_LEVELS = ['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'];
const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%', '125%'];
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
    const inventoryToppings = inventory
      .filter(
        (item) => item.categoryName?.toLowerCase() === 'toppings' && item.isActive
      )
      .map((item) => ({ name: item.name, cost: item.cost }));

    if (inventoryToppings.length > 0) return inventoryToppings;

    const toppings = AVAILABLE_TOPPINGS.map((topping) => {
      const normalizedTopping = normalizeToppingName(topping);
      const inventoryItem = inventory.find((item) => {
        const normalizedInventoryName = normalizeToppingName(item.name);

        if (normalizedInventoryName === normalizedTopping) return true;

        if (topping === 'Boba') {
          return (
            normalizedInventoryName.includes('tapioca') ||
            normalizedInventoryName === 'boba'
          );
        }

        return false;
      });

      return {
        name: topping,
        cost: inventoryItem?.cost ?? TOPPING_COSTS[topping] ?? 0,
      };
    });

    if (toppings.length > 0) return toppings;
  } catch {
    // The assistant can still work if inventory is unavailable.
  }

  return [
    ...AVAILABLE_TOPPINGS.map((name) => ({ name, cost: TOPPING_COSTS[name] ?? 0 })),
  ];
}

export async function createAssistantCartItems(input: {
  itemName: string;
  quantity?: number;
  iceLevel?: string;
  sugarLevel?: string;
  topping?: string;
  cupSize?: string;
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
  const topping = formatToppings(input.topping);
  const cartItem: AssistantCartItem = {
    menuid: matchedItem.menuid,
    name: matchedItem.name,
    cost: matchedItem.cost + getToppingsCost(topping),
    image_url: matchedItem.image_url,
    quantity,
    iceLevel: pickClosest(input.iceLevel, ICE_LEVELS, 'Regular Ice'),
    sugarLevel: pickClosest(input.sugarLevel, SUGAR_LEVELS, '100%'),
    topping,
    cupSize: DEFAULT_CUP_SIZE,
  };

  return {
    cartItems: [cartItem],
    matchedItem,
    message: `Added ${quantity} ${matchedItem.name} to the cart draft.`,
  };
}

export async function createWeatherRecommendedCartItem() {
  const menu = (await getMenuItems()).map(withMenuDetails);
  let weather = null;

  try {
    weather = await loadWeatherSnapshot({
      latitude: 30.628,
      longitude: -96.3344,
      timezone: 'America/Chicago',
      forecastDays: 3,
      locationLabel: 'College Station, TX',
    });
  } catch {
    weather = null;
  }

  const recommendedItem = pickWeatherRecommendedItem(menu, weather);

  if (!recommendedItem) {
    return {
      cartItems: [],
      matchedItem: null,
      weather,
      reason: 'No menu items were available for a weather recommendation.',
      message: 'I could not find a drink to recommend right now.',
    };
  }

  const cartItem: AssistantCartItem = {
    menuid: recommendedItem.menuid,
    name: recommendedItem.name,
    cost: recommendedItem.cost,
    image_url: recommendedItem.image_url,
    quantity: 1,
    iceLevel: 'Regular Ice',
    sugarLevel: '100%',
    topping: 'None',
    cupSize: DEFAULT_CUP_SIZE,
  };

  const reason = getWeatherRecommendationMeta(weather).reason;

  return {
    cartItems: [cartItem],
    matchedItem: recommendedItem,
    weather,
    reason,
    message: `Added ${recommendedItem.name}, today's weather-based recommendation.`,
  };
}
