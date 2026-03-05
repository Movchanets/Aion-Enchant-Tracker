import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type AttemptRecord,
  type ItemQuality,
  type Language,
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
  targetLevel: number;
  isSuccess: boolean;
  itemGrade: ItemQuality;
  stoneLevel: string;
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
    level: number,
    type: 'success' | 'fail',
    critType?: 'crit2' | 'crit3',
  ) => void;
  setGearQuality: (quality: ItemQuality) => void;
  setGearStoneLevel: (level: StoneLevel) => void;
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
    selectedItemLevel: 80,
  };
}

function initUnsyncedAttempts(): UnsyncedAttemptsState {
  return {
    feathers: [],
    accessories: [],
    gear: [],
  };
}

/* ── Helpers ── */

function ensureGearPath(
  stats: GearState['stats'],
  quality: string,
  stone: number,
  level: number,
): GearAttemptRecord {
  if (!stats[quality]) stats[quality] = {};
  if (!stats[quality][stone]) stats[quality][stone] = {};
  if (!stats[quality][stone][level]) {
    stats[quality][stone][level] = { success: 0, fail: 0 };
  }
  return stats[quality][stone][level];
}

function ensureGearInventoryPath(
  inventory: GearState['inventory'],
  quality: string,
  level: number,
): number {
  if (!inventory[quality]) inventory[quality] = {};
  inventory[quality][level] ??= 0;
  return inventory[quality][level];
}

function ensureGearCritByItemLevelPath(
  critByItemLevel: GearState['critByItemLevel'],
  itemLevel: number,
): { successTotal: number; critTotal: number } {
  critByItemLevel[itemLevel] ??= { successTotal: 0, critTotal: 0 };
  return critByItemLevel[itemLevel];
}

/* ── Store ── */

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTab: 'dashboard',
      language: 'uk',
      feathers: initFeathers(),
      accessories: initAccessories(),
      gear: initGear(),
      unsyncedAttempts: initUnsyncedAttempts(),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setLanguage: (language) => set({ language }),

      /* ── Feathers: failure DESTROYS the item ── */
      recordFeatherAttempt: (targetLevel, type) =>
        set((state) => {
          const f = structuredClone(state.feathers);
          // Need a source feather (base +0 is infinite)
          if (targetLevel > 1 && f.inventory[targetLevel - 1] <= 0) return state;
          if (targetLevel > 1) f.inventory[targetLevel - 1]--;
          f.stats[targetLevel][type]++;
          if (type === 'success') f.inventory[targetLevel]++;

          return {
            feathers: f,
            unsyncedAttempts: {
              ...state.unsyncedAttempts,
              feathers: [
                ...state.unsyncedAttempts.feathers,
                {
                  targetLevel,
                  isSuccess: type === 'success',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          };
        }),

      /* ── Accessories: configurable fail behaviour ── */
      recordAccessoryAttempt: (targetLevel, type) =>
        set((state) => {
          const a = structuredClone(state.accessories);
          if (targetLevel > 1 && a.inventory[targetLevel - 1] <= 0) return state;
          if (targetLevel > 1) a.inventory[targetLevel - 1]--;
          a.stats[targetLevel][type]++;
          if (type === 'success') a.inventory[targetLevel]++;
          if (type === 'fail') a.inventory[0]++;

          return {
            accessories: a,
            unsyncedAttempts: {
              ...state.unsyncedAttempts,
              accessories: [
                ...state.unsyncedAttempts.accessories,
                {
                  targetLevel,
                  isSuccess: type === 'success',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          };
        }),

      /* ── Gear: failure drops level by 1, item NOT destroyed ── */
      recordGearAttempt: (quality, stoneLevel, level, type, critType) =>
        set((state) => {
          const g = structuredClone(state.gear);
          const itemLevel = g.selectedItemLevel;
          const sourceLevel = level - 1;

          if (level > 1) {
            const sourceCount = ensureGearInventoryPath(g.inventory, quality, level - 1);
            if (sourceCount <= 0) return state;
            g.inventory[quality][level - 1]--;
          }

          const rec = ensureGearPath(g.stats, quality, stoneLevel, level);
          rec[type]++;

          if (type === 'success') {
            ensureGearCritByItemLevelPath(g.critByItemLevel, itemLevel).successTotal++;
            const critIsEnabled = sourceLevel < 10;
            const critJump = critIsEnabled
              ? critType === 'crit3'
                ? 3
                : critType === 'crit2'
                  ? 2
                  : 1
              : 1;
            const resultLevel = Math.min(sourceLevel + critJump, 15);
            ensureGearInventoryPath(g.inventory, quality, resultLevel);
            g.inventory[quality][resultLevel]++;
          }

          if (type === 'fail' && level > 1) {
            const downLevel = sourceLevel >= 11 ? 10 : Math.max(0, sourceLevel - 1);
            ensureGearInventoryPath(g.inventory, quality, downLevel);
            g.inventory[quality][downLevel]++;
          }

          if (type === 'success' && critType && sourceLevel < 10) {
            ensureGearCritByItemLevelPath(g.critByItemLevel, itemLevel).critTotal++;
          }

          return {
            gear: g,
            unsyncedAttempts: {
              ...state.unsyncedAttempts,
              gear: [
                ...state.unsyncedAttempts.gear,
                {
                  targetLevel: level,
                  isSuccess: type === 'success',
                  itemGrade: quality,
                  stoneLevel: String(stoneLevel),
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          };
        }),

      setGearQuality: (q) => set((s) => ({ gear: { ...s.gear, selectedQuality: q } })),
      setGearStoneLevel: (l) => set((s) => ({ gear: { ...s.gear, selectedStoneLevel: l } })),
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
