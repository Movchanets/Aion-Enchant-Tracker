import type { Language } from './types';

type Dict = Record<string, { uk: string; en: string }>;

const DICT: Dict = {
  appTitle: { uk: 'Riftshade: Трекер заточки ', en: 'Riftshade: Enchant Tracker' },
  export: { uk: 'Експорт', en: 'Export' },
  import: { uk: 'Імпорт', en: 'Import' },
  reset: { uk: 'Скинути', en: 'Reset' },
  tabDashboard: { uk: 'Огляд', en: 'Dashboard' },
  tabGlobal: { uk: 'Глобальна', en: 'Global' },
  tabFeathers: { uk: 'Пера', en: 'Feathers' },
  tabAccessories: { uk: 'Аксесуари', en: 'Accessories' },
  tabGear: { uk: 'Екіпірування', en: 'Gear' },
  tabCalculator: { uk: 'Калькулятор', en: 'Calculator' },
  localStorageFooter: { uk: 'Дані зберігаються у LocalStorage', en: 'Data is saved in LocalStorage' },
  resetTitle: { uk: 'Скинути всі дані', en: 'Reset all data' },
  resetMessage: {
    uk: 'Ви впевнені, що хочете очистити всю зібрану статистику та інвентар? Цю дію неможливо скасувати.',
    en: 'Are you sure you want to clear all tracked stats and inventory? This action cannot be undone.',
  },
  cancel: { uk: 'Скасувати', en: 'Cancel' },
  confirm: { uk: 'Підтвердити', en: 'Confirm' },
  importOk: { uk: 'Дані успішно імпортовано!', en: 'Data imported successfully!' },
  importBadFormat: { uk: 'Некоректний формат файлу.', en: 'Invalid file format.' },
  importReadError: { uk: 'Помилка читання файлу.', en: 'File read error.' },

  dashboardTitle: { uk: 'Огляд модулів', en: 'Module overview' },
  totalAttempts: { uk: 'Всього спроб', en: 'Total attempts' },
  successes: { uk: 'Успішних', en: 'Successes' },
  fails: { uk: 'Невдач', en: 'Fails' },
  chance: { uk: 'Шанс успіху', en: 'Success chance' },
  noDataYet: { uk: 'Поки що немає даних', en: 'No data yet' },
  startTrackingHint: {
    uk: 'Оберіть вкладку вище та почніть відстежувати спроби заточки.',
    en: 'Open any tab above and start tracking enchant attempts.',
  },
  featherChancesByStep: { uk: 'Шанси заточки пер по кроках', en: 'Feather chances by step' },
  step: { uk: 'Крок', en: 'Step' },

  gearTitle: { uk: 'Екіпірування', en: 'Gear' },
  gearHint: {
    uk: 'При невдачі рівень заточки знижується на 1. з +11 до +15 заточка падає до +10.',
    en: 'On fail, enchant level drops by 1. From +11 to +15, enchantment level drops to +10.',
  },
  quality: { uk: 'Якість предмета', en: 'Item quality' },
  stoneLevel: { uk: 'Рівень каменю заточки', en: 'Enchantment stone level' },
  filter: { uk: 'Фільтр', en: 'Filter' },
  successBtn: { uk: '+ Успіх', en: '+ Success' },
  failBtn: { uk: '− Невдача', en: '− Fail' },
  critSection: { uk: 'Критичне зачарування', en: 'Critical enchant' },
  critPlus2: { uk: 'Крит +2', en: 'Crit +2' },
  critPlus3: { uk: 'Крит +3', en: 'Crit +3' },
  highEnchantNoCritHint: {
    uk: 'Для спроб від +10 до +15 кріт не працює.',
    en: 'Crit does not work for +10 to +15 attempts.',
  },
  globalCritChance: { uk: 'Загальний шанс кріту заточки', en: 'Global enchant critical chance' },

  calculatorTitle: { uk: 'Калькулятор ціни пера', en: 'Feather price calculator' },
  calculatorHint: {
    uk: 'Розрахунок використовує шанси з вкладки Пера для кожного кроку (+0→+1, +1→+2...).',
    en: 'This calculation uses chances from the Feathers tab for each step (+0→+1, +1→+2...).',
  },
  calculatorHintGlobal: {
    uk: 'Розрахунок використовує глобальні шанси (з бази всіх гравців) для кожного кроку.',
    en: 'This calculation uses global chances (from all players) for each step.',
  },
  statsSource: { uk: 'Джерело шансів', en: 'Chance source' },
  localStats: { uk: 'Локальна', en: 'Local' },
  globalStats: { uk: 'Глобальна', en: 'Global' },
  loadingGlobalStats: { uk: 'Завантаження глобальних даних...', en: 'Loading global data...' },
  globalStatsError: { uk: 'Помилка завантаження глобальних шансів', en: 'Failed to load global chances' },
  missingStepDataGlobal: {
    uk: 'Відсутня глобальна статистика для деяких кроків до цільового рівня.',
    en: 'Missing global step data for some steps up to target level.',
  },
  targetEnchant: { uk: 'Бажане зачарування', en: 'Target enchant level' },
  waterPrice: { uk: 'Ціна 1 Святої води', en: 'Price of 1 Tempering Solution' },
  baseFeatherPrice: { uk: 'Базова ціна пера', en: 'Base feather price' },
  avgFeathersNeeded: { uk: 'В середньому потрібно пер', en: 'Average feathers needed' },
  avgWaterNeeded: { uk: 'В середньому потрібно води', en: 'Average tempering solution needed' },
  estTotalCost: { uk: 'Орієнтовна собівартість', en: 'Estimated total cost' },
  missingStepData: {
    uk: 'Немає статистики для частини кроків до цільового рівня. Заповніть дані у вкладці Пера.',
    en: 'Missing step stats up to target level. Record feather attempts first.',
  },

  feathersTitle: { uk: 'Пера', en: 'Feathers' },
  feathersHint: {
    uk: 'При невдачі перо знищується повністю. Базові пера (+0) — необмежені.',
    en: 'On fail, feather is destroyed. Base feathers (+0) are unlimited.',
  },
  accessoriesTitle: { uk: 'Аксесуари', en: 'Accessories' },
  accessoriesHint: {
    uk: 'При невдачі аксесуар падає до +0.',
    en: 'On fail, accessory drops to +0.',
  },
  failBehavior: { uk: 'При невдачі', en: 'On fail' },
  destroy: { uk: 'Знищення', en: 'Destroy' },
  resetToZero: { uk: 'Скид до +0', en: 'Reset to +0' },
  itemLevel: { uk: 'Рівень предмета', en: 'Item level' },
  baseItems: { uk: 'Базові', en: 'Base' },
  inStock: { uk: 'Наявні', en: 'In stock' },
  breakBtn: { uk: '− Злам', en: '− Break' },
};

export function tr(lang: Language, key: keyof typeof DICT): string {
  return DICT[key][lang];
}
