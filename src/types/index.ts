/* ── Shared types & constants ── */

export type Tab = 'dashboard' | 'global' | 'feathers' | 'accessories' | 'gear' | 'calculator';

export type Language = 'uk' | 'en';

export type ItemQuality = 'white' | 'green' | 'blue' | 'gold' | 'orange' | 'purple';
export type StoneLevel = 1 | 2 | 3 | 4 | 5;
export type SupplementTier = 'none' | 'lesser' | 'regular' | 'greater';

export interface AttemptRecord {
  success: number;
  fail: number;
}

/* ── Quality metadata ── */

export const QUALITY_META: Record<ItemQuality, { label: string; labelUk: string; color: string }> = {
  white:  { label: 'White',  labelUk: 'Білий',       color: '#c0c0c0' },
  green:  { label: 'Green',  labelUk: 'Зелений',     color: '#2ecc71' },
  blue:   { label: 'Blue',   labelUk: 'Синій',       color: '#3498db' },
  gold:   { label: 'Gold',   labelUk: 'Золотий',     color: '#d4af37' },
  orange: { label: 'Orange', labelUk: 'Помаранчевий', color: '#e67e22' },
  purple: { label: 'Purple', labelUk: 'Фіолетовий',  color: '#9b59b6' },
};

export const ALL_QUALITIES: ItemQuality[] = ['white', 'green', 'blue', 'gold', 'orange', 'purple'];
export const ALL_STONE_LEVELS: StoneLevel[] = [1, 2, 3, 4, 5];
export const ALL_SUPPLEMENTS: SupplementTier[] = ['none', 'lesser', 'regular', 'greater'];
export const SUPPLEMENT_BONUS: Record<SupplementTier, number> = {
  none: 0,
  lesser: 5,
  regular: 10,
  greater: 15,
};

/* ── Level caps ── */

export const FEATHER_MAX = 10;
export const ACCESSORY_MAX = 5;
export const GEAR_MAX = 15;

/* ── Helpers ── */

export function getChance(record: AttemptRecord): string {
  const total = record.success + record.fail;
  if (total === 0) return '0.0';
  return ((record.success / total) * 100).toFixed(1);
}

export function getTotal(record: AttemptRecord): number {
  return record.success + record.fail;
}
