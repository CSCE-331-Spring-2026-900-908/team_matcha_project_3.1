import { getInventoryItems } from '@/lib/inventory';
import { getMenuItems, type MenuItem } from '@/lib/menu';
import { MENU_EXTRAS } from '@/lib/menu-data';
import { AVAILABLE_TOPPINGS, formatToppings, getToppingsCost, TOPPING_COSTS } from '@/lib/toppings';
import { loadWeatherSnapshot } from '@/lib/weather';

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
    ...AVAILABLE_TOPPINGS.map((name) => ({ name, cost: TOPPING_COSTS[name] ?? 0 })),
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
  };

  return {
    cartItems: [cartItem],
    matchedItem,
    message: `Added ${quantity} ${matchedItem.name} to the cart draft.`,
  };
}

function pickWeatherRecommendedItem(
  items: MenuSearchResult[],
  weather: {
    current: {
      temperatureF: number | null;
      condition: string;
    };
  } | null
) {
  if (items.length === 0) return null;

  const currentTemp = weather?.current.temperatureF;
  const condition = weather?.current.condition.toLowerCase() ?? '';

  const findByKeywords = (keywords: string[]) =>
    items.find((item) => keywords.some((keyword) => item.name.toLowerCase().includes(keyword)));

  if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
    return findByKeywords(['latte', 'milk', 'matcha']) ?? items[0];
  }

  if (condition.includes('snow') || condition.includes('fog')) {
    return findByKeywords(['latte', 'milk', 'tea']) ?? items[0];
  }

  if (typeof currentTemp === 'number' && currentTemp >= 82) {
    return findByKeywords(['fruit', 'mango', 'strawberry', 'tea']) ?? items[0];
  }

  if (typeof currentTemp === 'number' && currentTemp <= 55) {
    return findByKeywords(['matcha', 'latte', 'milk']) ?? items[0];
  }

  return findByKeywords(['matcha', 'tea', 'milk']) ?? items[0];
}

function getWeatherRecommendationReason(
  weather: {
    current: {
      temperatureF: number | null;
      condition: string;
    };
  } | null
) {
  const currentTemp = weather?.current.temperatureF;
  const condition = weather?.current.condition.toLowerCase() ?? '';

  if (condition.includes('rain') || condition.includes('thunderstorm')) {
    return 'Rainy weather calls for something smoother and more comforting.';
  }

  if (typeof currentTemp === 'number' && currentTemp >= 82) {
    return 'Warm weather makes a lighter, refreshing drink a strong pick.';
  }

  if (typeof currentTemp === 'number' && currentTemp <= 55) {
    return 'Cool weather makes a richer, cozier drink feel right.';
  }

  return 'Today feels like a good match for a balanced house favorite.';
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
  };

  const reason = getWeatherRecommendationReason(weather);

  return {
    cartItems: [cartItem],
    matchedItem: recommendedItem,
    weather,
    reason,
    message: `Added ${recommendedItem.name}, today's weather-based recommendation.`,
  };
}
