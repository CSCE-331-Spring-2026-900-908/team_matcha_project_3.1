export type MenuCategoryKey = 'milkTeas' | 'fruitTeas' | 'greenOolongTeas';

export type MenuCategory = {
  key: MenuCategoryKey;
  label: string;
  color: string;
};

export const MENU_CATEGORIES: MenuCategory[] = [
  { key: 'milkTeas', label: 'Milk Teas', color: '#c95d70' },
  { key: 'fruitTeas', label: 'Fruit Teas', color: '#d79b28' },
  { key: 'greenOolongTeas', label: 'Green & Oolong Teas', color: '#3f8a5a' },
];

export const MENU_CATEGORY_LABELS = MENU_CATEGORIES.map(
  (category) => category.label
);

export function getMenuCategoryByLabel(label: string) {
  return MENU_CATEGORIES.find((category) => category.label === label) ?? null;
}

export function categorizeMenuItem(name: string): MenuCategory | null {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes('green tea') || normalizedName.includes('oolong')) {
    return getMenuCategoryByLabel('Green & Oolong Teas');
  }

  if (normalizedName.includes('fruit tea')) {
    return getMenuCategoryByLabel('Fruit Teas');
  }

  if (normalizedName.includes('milk tea')) {
    return getMenuCategoryByLabel('Milk Teas');
  }

  return null;
}
