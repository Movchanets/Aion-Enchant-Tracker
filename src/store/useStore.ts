import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type AttemptRecord,
  type ItemQuality,
  type Language,
  type SupplementTier,
  type StoneLevel,
  type Tab,
  FEATHER_MAX,
  ACCESSORY_MAX,
} from '../types';

/* ── Sub-state interfaces ── */

interface FeatherState {
  stats: Record<number, AttemptRecord>;
  inventory: Record<number, number>;
}

interface AccessoryState {
  stats: Record<number, AttemptRecord>;
  inventory: Record<number, number>;
}

interface GearState {
  /** stats[quality][stoneLevel][enchantLevel] → AttemptRecord */
  stats: Record<string, Record<number, Record<number, GearAttemptRecord>>>;
  /** inventory[quality][enchantLevel] → count */
  inventory: Record<string, Record<number, number>>;
  /** critByItemLevel[itemLevel] → counters for crit chance */
  critByItemLevel: Record<number, { successTotal: number; critTotal: number }>;
  selectedQuality: ItemQuality;
  selectedStoneLevel: StoneLevel;
  selectedSupplement: SupplementTier;
  selectedItemLevel: number;
}

interface GearAttemptRecord {
  success: number;
  fail: number;
}

interface FeatherUnsyncedAttempt {
  targetLevel: number;
  isSuccess: boolean;
  createdAt: string;
}

interface AccessoryUnsyncedAttempt {
  targetLevel: number;
  isSuccess: boolean;
  createdAt: string;
}

interface GearUnsyncedAttempt {
  itemLevel: number;
  targetLevel: number;
  isSuccess: boolean;
  itemGrade: ItemQuality;
  stoneLevel: string;
  supplement: SupplementTier;
  createdAt: string;
}

interface UnsyncedAttemptsState {
  feathers: FeatherUnsyncedAttempt[];
  accessories: AccessoryUnsyncedAttempt[];
  gear: GearUnsyncedAttempt[];
}

/* ── Full store interface ── */

export interface AppState {
  activeTab: Tab;
  language: Language;
  feathers: FeatherState;
  accessories: AccessoryState;
  gear: GearState;
  unsyncedAttempts: UnsyncedAttemptsState;

  setActiveTab: (tab: Tab) => void;
  setLanguage: (language: Language) => void;

  recordFeatherAttempt: (targetLevel: number, type: 'success' | 'fail') => void;
  recordAccessoryAttempt: (targetLevel: number, type: 'success' | 'fail') => void;

  recordGearAttempt: (
    quality: ItemQuality,
    stoneLevel: StoneLevel,
    supplement: SupplementTier,
    level: number,
    type: 'success' | 'fail',
    critType?: 'crit2' | 'crit3',
  ) => void;
  setGearQuality: (quality: ItemQuality) => void;
  setGearStoneLevel: (level: StoneLevel) => void;
  setGearSupplement: (supplement: SupplementTier) => void;
  setGearItemLevel: (itemLevel: number) => void;
  clearUnsyncedQueues: () => void;

  resetAll: () => void;
  getExportData: () => object;
  importData: (data: unknown) => boolean;
}

/* ── Initializers ── */

function initFeathers(): FeatherState {
  const stats: Record<number, AttemptRecord> = {};
  const inventory: Record<number, number> = {};
  for (let i = 1; i <= FEATHER_MAX; i++) stats[i] = { success: 0, fail: 0 };
  for (let i = 0; i <= FEATHER_MAX; i++) inventory[i] = 0;
  return { stats, inventory };
}

function initAccessories(): AccessoryState {
  const stats: Record<number, AttemptRecord> = {};
  const inventory: Record<number, number> = {};
  for (let i = 1; i <= ACCESSORY_MAX; i++) stats[i] = { success: 0, fail: 0 };
  for (let i = 0; i <= ACCESSORY_MAX; i++) inventory[i] = 0;
  return { stats, inventory };
}

function initGear(): GearState {
  return {
    stats: {},
    inventory: {},
    critByItemLevel: {},
    selectedQuality: 'gold',
    selectedStoneLevel: 1,
    selectedSupplement: 'none',
    selectedItemLevel: 65,
  };
}

function initUnsyncedAttempts(): UnsyncedAttemptsState {
  return {
    feathers: [],
    accessories: [],
    gear: [],
  };
}

/* ── Store ── */

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'dashboard',
      language: 'en',
      feathers: initFeathers(),
      accessories: initAccessories(),
      gear: initGear(),
      unsyncedAttempts: initUnsyncedAttempts(),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setLanguage: (language) => set({ language }),

      /* ── Feathers: failure DESTROYS the item ── */
      recordFeatherAttempt: (targetLevel, type) =>
        set((state) => {
          const sourceLevel = targetLevel - 1;
          const currentInventory = state.feathers.inventory[sourceLevel] ?? 0;
          if (targetLevel > 1 && currentInventory <= 0) return state;

          const createdAt = new Date().toISOString();
          const nextInventory = { ...state.feathers.inventory };
          const nextStats = {
            ...state.feathers.stats,
            [targetLevel]: {
              ...state.feathers.stats[targetLevel],
              [type]: state.feathers.stats[targetLevel][type] + 1,
            },
          };

          if (targetLevel > 1) nextInventory[sourceLevel] = currentInventory - 1;
          if (type === 'success') nextInventory[targetLevel] = (nextInventory[targetLevel] ?? 0) + 1;

          return {
            feathers: {
              stats: nextStats,
              inventory: nextInventory,
            },
            unsyncedAttempts: {
              ...state.unsyncedAttempts,
              feathers: [
                ...state.unsyncedAttempts.feathers,
                {
                  targetLevel,
                  isSuccess: type === 'success',
                  createdAt,
                },
              ],
            },
          };
        }),

      /* ── Accessories: configurable fail behaviour ── */
      recordAccessoryAttempt: (targetLevel, type) =>
        set((state) => {
          const sourceLevel = targetLevel - 1;
          const currentInventory = state.accessories.inventory[sourceLevel] ?? 0;
          if (targetLevel > 1 && currentInventory <= 0) return state;

          const createdAt = new Date().toISOString();
          const nextInventory = { ...state.accessories.inventory };
          const nextStats = {
            ...state.accessories.stats,
            [targetLevel]: {
              ...state.accessories.stats[targetLevel],
              [type]: state.accessories.stats[targetLevel][type] + 1,
            },
          };

          if (targetLevel > 1) nextInventory[sourceLevel] = currentInventory - 1;
          if (type === 'success') nextInventory[targetLevel] = (nextInventory[targetLevel] ?? 0) + 1;
          if (type === 'fail') nextInventory[0] = (nextInventory[0] ?? 0) + 1;

          return {
            accessories: {
              stats: nextStats,
              inventory: nextInventory,
            },
            unsyncedAttempts: {
              ...state.unsyncedAttempts,
              accessories: [
                ...state.unsyncedAttempts.accessories,
                {
                  targetLevel,
                  isSuccess: type === 'success',
                  createdAt,
                },
              ],
            },
          };
        }),

      /* ── Gear: failure drops level by 1, item NOT destroyed ── */
      recordGearAttempt: (quality, stoneLevel, supplement, level, type, critType) =>
        set((state) => {
          const itemLevel = state.gear.selectedItemLevel;
          const sourceLevel = level - 1;
          const currentQualityInventory = state.gear.inventory[quality] ?? {};
          const currentSourceCount = currentQualityInventory[sourceLevel] ?? 0;

          if (level > 1 && currentSourceCount <= 0) return state;

          const createdAt = new Date().toISOString();
          const nextQualityInventory = { ...currentQualityInventory };
          if (level > 1) nextQualityInventory[sourceLevel] = currentSourceCount - 1;

          if (type === 'success') {
            const critIsEnabled = sourceLevel < 10;
            const critJump = critIsEnabled
              ? critType === 'crit3'
                ? 3
                : critType === 'crit2'
                  ? 2
                  : 1
              : 1;
            const resultLevel = Math.min(sourceLevel + critJump, 15);
            nextQualityInventory[resultLevel] = (nextQualityInventory[resultLevel] ?? 0) + 1;
          }

          if (type === 'fail' && level > 1) {
            const downLevel = sourceLevel >= 11 ? 10 : Math.max(0, sourceLevel - 1);
            nextQualityInventory[downLevel] = (nextQualityInventory[downLevel] ?? 0) + 1;
          }

          const qualityStats = state.gear.stats[quality] ?? {};
          const stoneStats = qualityStats[stoneLevel] ?? {};
          const previousRecord = stoneStats[level] ?? { success: 0, fail: 0 };
          const nextStats = {
            ...state.gear.stats,
            [quality]: {
              ...qualityStats,
              [stoneLevel]: {
                ...stoneStats,
                [level]: {
                  ...previousRecord,
                  [type]: previousRecord[type] + 1,
                },
              },
            },
          };

          let nextCritByItemLevel = state.gear.critByItemLevel;
          if (type === 'success') {
            const previousCrit = state.gear.critByItemLevel[itemLevel] ?? { successTotal: 0, critTotal: 0 };
            nextCritByItemLevel = {
              ...state.gear.critByItemLevel,
              [itemLevel]: {
                successTotal: previousCrit.successTotal + 1,
                critTotal: previousCrit.critTotal + (critType && sourceLevel < 10 ? 1 : 0),
              },
            };
          }

          return {
            gear: {
              ...state.gear,
              stats: nextStats,
              inventory: {
                ...state.gear.inventory,
                [quality]: nextQualityInventory,
              },
              critByItemLevel: nextCritByItemLevel,
            },
            unsyncedAttempts: {
              ...state.unsyncedAttempts,
              gear: [
                ...state.unsyncedAttempts.gear,
                {
                  itemLevel,
                  targetLevel: level,
                  isSuccess: type === 'success',
                  itemGrade: quality,
                  stoneLevel: String(stoneLevel),
                  supplement,
                  createdAt,
                },
              ],
            },
          };
        }),

      setGearQuality: (q) => set((s) => ({ gear: { ...s.gear, selectedQuality: q } })),
      setGearStoneLevel: (l) => set((s) => ({ gear: { ...s.gear, selectedStoneLevel: l } })),
      setGearSupplement: (supplement) =>
        set((s) => ({ gear: { ...s.gear, selectedSupplement: supplement } })),
      setGearItemLevel: (itemLevel) =>
        set((s) => ({
          gear: {
            ...s.gear,
            selectedItemLevel: Math.max(1, Math.floor(itemLevel) || 1),
          },
        })),

      clearUnsyncedQueues: () => set({ unsyncedAttempts: initUnsyncedAttempts() }),

      /* ── Global actions ── */
      resetAll: () =>
        set({
          feathers: initFeathers(),
          accessories: initAccessories(),
          gear: initGear(),
          unsyncedAttempts: initUnsyncedAttempts(),
        }),

      getExportData: () => {
        const { feathers, accessories, gear, unsyncedAttempts } = get();
        return {
          version: 1,
          exportedAt: new Date().toISOString(),
          feathers,
          accessories,
          gear,
          unsyncedAttempts,
        };
      },

      importData: (raw) => {
        try {
          const d = raw as Record<string, unknown>;
          // New format (v1)
          if (d.version === 1 && d.feathers && d.accessories && d.gear) {
            const importedGear = d.gear as GearState;
            importedGear.inventory ??= {};
            importedGear.selectedItemLevel ??= 80;
            importedGear.critByItemLevel ??= {};
            importedGear.selectedSupplement ??= 'none';
            const legacyCrit = (d.gear as { crit?: { successTotal: number; critTotal: number } }).crit;
            if (legacyCrit && Object.keys(importedGear.critByItemLevel).length === 0) {
              importedGear.critByItemLevel[importedGear.selectedItemLevel] = legacyCrit;
            }
            set({
              feathers: d.feathers as FeatherState,
              accessories: d.accessories as AccessoryState,
              gear: importedGear,
              unsyncedAttempts: (d.unsyncedAttempts as UnsyncedAttemptsState) ?? initUnsyncedAttempts(),
            });
            return true;
          }
          // Legacy format from the old tracker.html (feather-only)
          if (d.stats && d.inventory && !d.version) {
            const f = initFeathers();
            const stats = d.stats as Record<string, AttemptRecord>;
            const inv = d.inventory as Record<string, number>;
            for (const k of Object.keys(stats)) f.stats[Number(k)] = stats[k];
            for (const k of Object.keys(inv)) f.inventory[Number(k)] = inv[k];
            set({ feathers: f, unsyncedAttempts: initUnsyncedAttempts() });
            return true;
          }
          return false;
        } catch {
          return false;
        }
      },
    }),
    { name: 'aion-enchant-tracker' },
  ),
);
