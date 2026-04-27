export const NO_TOPPING = 'None';

export const TOPPING_COSTS: Record<string, number> = {
  Boba: 0.5,
  'Red Bean': 0.5,
  'Lychee Jelly': 0.5,
  Pudding: 0.5,
  'Crystal Boba': 0.75,
  'Mango Popping Boba': 0.75,
  'Ice Cream': 0.75,
  'Honey Jelly': 0.5,
};

export const AVAILABLE_TOPPINGS = Object.keys(TOPPING_COSTS);

const TOPPING_ALIASES: Record<string, string> = {
  tapioca: 'Boba',
  'tapioca pearls': 'Boba',
  'tapioca pearls boba': 'Boba',
  pearl: 'Boba',
  pearls: 'Boba',
  boba: 'Boba',
  'red bean': 'Red Bean',
  redbean: 'Red Bean',
  'lychee jelly': 'Lychee Jelly',
  pudding: 'Pudding',
  'crystal boba': 'Crystal Boba',
  'mango popping boba': 'Mango Popping Boba',
  'popping boba': 'Mango Popping Boba',
  'mango boba': 'Mango Popping Boba',
  'ice cream': 'Ice Cream',
  icecream: 'Ice Cream',
  'honey jelly': 'Honey Jelly',
};

export function normalizeToppingName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseToppings(value?: string | string[] | null) {
  const rawToppings = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((topping) => topping.trim());

  return rawToppings.reduce<string[]>((toppings, rawTopping) => {
    const normalized = normalizeToppingName(rawTopping);
    const canonical = TOPPING_ALIASES[normalized] ?? rawTopping.trim();

    if (!canonical || canonical === NO_TOPPING || !TOPPING_COSTS[canonical]) {
      return toppings;
    }

    if (!toppings.includes(canonical)) {
      toppings.push(canonical);
    }

    return toppings;
  }, []);
}

export function formatToppings(value?: string | string[] | null) {
  const toppings = parseToppings(value);
  return toppings.length > 0 ? toppings.join(', ') : NO_TOPPING;
}

export function getToppingsCost(value?: string | string[] | null) {
  return parseToppings(value).reduce(
    (total, topping) => total + (TOPPING_COSTS[topping] ?? 0),
    0
  );
}
