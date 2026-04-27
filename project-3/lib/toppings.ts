export const NO_TOPPING = 'None';

export const TOPPING_COSTS: Record<string, number> = {
  Boba: 0.5,
  Honey: 0.5,
  'Red Bean': 0.5,
};

export const AVAILABLE_TOPPINGS = Object.keys(TOPPING_COSTS);

const TOPPING_ALIASES: Record<string, string> = {
  tapioca: 'Boba',
  'tapioca pearls': 'Boba',
  pearl: 'Boba',
  pearls: 'Boba',
  boba: 'Boba',
  honey: 'Honey',
  'honey boba': 'Honey',
  'red bean': 'Red Bean',
  redbean: 'Red Bean',
};

export function parseToppings(value?: string | string[] | null) {
  const rawToppings = Array.isArray(value)
    ? value
    : String(value ?? '')
        .split(',')
        .map((topping) => topping.trim());

  return rawToppings.reduce<string[]>((toppings, rawTopping) => {
    const normalized = rawTopping.toLowerCase().replace(/\s+/g, ' ').trim();
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
