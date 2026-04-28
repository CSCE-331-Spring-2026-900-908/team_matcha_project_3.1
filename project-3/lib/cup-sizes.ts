export type CupSize = 'Small' | 'Medium' | 'Large';

export const CUP_SIZES: CupSize[] = ['Small', 'Medium', 'Large'];

export const DEFAULT_CUP_SIZE: CupSize = 'Medium';

export const CUP_SIZE_MULTIPLIERS: Record<CupSize, number> = {
  Small: 0.75,
  Medium: 1,
  Large: 1.5,
};

export const CUP_INVENTORY_IDS: Record<CupSize, number> = {
  Small: 35,
  Medium: 1,
  Large: 36,
};

export const CUP_LID_INVENTORY_ID = 2;
export const STRAW_INVENTORY_ID = 3;

export function normalizeCupSize(value?: string | null): CupSize {
  const normalized = String(value ?? '').toLowerCase().trim();

  if (normalized === 'small') return 'Small';
  if (normalized === 'large') return 'Large';

  return DEFAULT_CUP_SIZE;
}
