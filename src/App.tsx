import { lazy, startTransition, Suspense, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useStore } from './store/useStore';
import { ConfirmModal } from './components/ConfirmModal';
import { SubmitResultsButton } from './components/SubmitResultsButton';
import { Auth } from './components/Auth';
import { tr } from './i18n';
import type { Language, Tab } from './types';

const Dashboard = lazy(() => import('./components/Dashboard').then((module) => ({ default: module.Dashboard })));
const GlobalDashboard = lazy(() => import('./components/GlobalDashboard').then((module) => ({ default: module.GlobalDashboard })));
const FeathersTracker = lazy(() => import('./components/FeathersTracker').then((module) => ({ default: module.FeathersTracker })));
const AccessoriesTracker = lazy(() => import('./components/AccessoriesTracker').then((module) => ({ default: module.AccessoriesTracker })));
const GearTracker = lazy(() => import('./components/GearTracker').then((module) => ({ default: module.GearTracker })));
const FeatherPriceCalculator = lazy(() => import('./components/FeatherPriceCalculator').then((module) => ({ default: module.FeatherPriceCalculator })));

const TABS: { key: Tab; labelKey: Parameters<typeof tr>[1]; icon: string }[] = [
  { key: 'dashboard', labelKey: 'tabDashboard', icon: '📊' },
  { key: 'global', labelKey: 'tabGlobal', icon: '🌍' },
  { key: 'feathers', labelKey: 'tabFeathers', icon: '🪶' },
  { key: 'accessories', labelKey: 'tabAccessories', icon: '💍' },
  { key: 'gear', labelKey: 'tabGear', icon: '⚔️' },
  { key: 'calculator', labelKey: 'tabCalculator', icon: '🧮' },
];

const TAB_COMPONENTS = {
  dashboard: Dashboard,
  global: GlobalDashboard,
  feathers: FeathersTracker,
  accessories: AccessoriesTracker,
  gear: GearTracker,
  calculator: FeatherPriceCalculator,
} satisfies Record<Tab, React.ComponentType>;

export default function App() {
  const { activeTab, language, setActiveTab, setLanguage, resetAll, getExportData, importData } = useStore(
    useShallow((state) => ({
      activeTab: state.activeTab,
      language: state.language,
      setActiveTab: state.setActiveTab,
      setLanguage: state.setLanguage,
      resetAll: state.resetAll,
      getExportData: state.getExportData,
      importData: state.importData,
    })),
  );

  const [showReset, setShowReset] = useState(false);
  const ActiveTabComponent = TAB_COMPONENTS[activeTab];

  const handleLanguageChange = (nextLanguage: Language) => {
    if (nextLanguage === language) return;
    startTransition(() => setLanguage(nextLanguage));
  };

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    startTransition(() => setActiveTab(tab));
  };

  /* ── Export ── */
  const handleExport = () => {
    const data = getExportData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aion_enchant_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /* ── Import ── */
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const raw = JSON.parse(ev.target?.result as string);
          if (importData(raw)) {
            alert(tr(language, 'importOk'));
          } else {
            alert(tr(language, 'importBadFormat'));
          }
        } catch {
          alert(tr(language, 'importReadError'));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        {tr(language, 'skipToContent')}
      </a>
      <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <header className="mb-6 space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-aion-gold tracking-tight break-words">
            {tr(language, 'appTitle')}
          </h1>
          <div className="flex w-full flex-wrap items-center gap-2">
            <Auth />
            <SubmitResultsButton />
            <div className="flex border border-aion-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => handleLanguageChange('uk')}
                aria-pressed={language === 'uk'}
                className={`px-2.5 py-1.5 text-xs transition-colors focus-visible:relative focus-visible:z-10 ${
                  language === 'uk' ? 'bg-aion-row text-aion-gold' : 'text-aion-muted hover:bg-white/5'
                }`}
              >
                UA
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                aria-pressed={language === 'en'}
                className={`px-2.5 py-1.5 text-xs transition-colors focus-visible:relative focus-visible:z-10 ${
                  language === 'en' ? 'bg-aion-row text-aion-gold' : 'text-aion-muted hover:bg-white/5'
                }`}
              >
                EN
              </button>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg border border-aion-gold text-aion-gold text-sm hover:bg-aion-gold/10 transition-colors"
            >
              📤 {tr(language, 'export')}
            </button>
            <button
              type="button"
              onClick={handleImport}
              className="px-3 py-1.5 rounded-lg border border-blue-400 text-blue-400 text-sm hover:bg-blue-400/10 transition-colors"
            >
              📥 {tr(language, 'import')}
            </button>
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="px-3 py-1.5 rounded-lg border border-aion-danger text-aion-danger text-sm whitespace-nowrap hover:bg-aion-danger/10 transition-colors"
            >
              🗑️ {tr(language, 'reset')}
            </button>
          </div>
        </header>

        {/* ── Tab Navigation ── */}
        <nav aria-label="Primary" className="flex gap-1 mb-6 bg-aion-card rounded-xl p-1 overflow-x-auto border border-aion-border">
          {TABS.map((tab) => (
            <button
              type="button"
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              aria-pressed={activeTab === tab.key}
              className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-aion-row text-aion-gold shadow-lg'
                  : 'text-aion-muted hover:text-aion-text hover:bg-white/5'
              }`}
            >
              <span aria-hidden="true" className="mr-1.5">{tab.icon}</span>
              {tr(language, tab.labelKey)}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <main id="main-content" className="bg-aion-card border border-aion-border rounded-xl p-4 md:p-6" tabIndex={-1}>
          <Suspense fallback={<div aria-live="polite" className="py-8 text-center text-sm text-aion-muted">Loading tab…</div>}>
            <ActiveTabComponent />
          </Suspense>
        </main>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-aion-muted mt-6">
          Aion Enchant Tracker &middot; {tr(language, 'localStorageFooter')}
        </footer>
      </div>

      {/* ── Reset modal ── */}
      <ConfirmModal
        isOpen={showReset}
        title={tr(language, 'resetTitle')}
        message={tr(language, 'resetMessage')}
        cancelLabel={tr(language, 'cancel')}
        confirmLabel={tr(language, 'confirm')}
        onConfirm={() => {
          resetAll();
          setShowReset(false);
        }}
        onCancel={() => setShowReset(false)}
      />
      </div>
    </>
  );
}
