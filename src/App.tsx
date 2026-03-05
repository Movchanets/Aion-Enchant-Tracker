import { useState } from 'react';
import { useStore } from './store/useStore';
import { ConfirmModal } from './components/ConfirmModal';
import { Dashboard } from './components/Dashboard';
import { GlobalDashboard } from './components/GlobalDashboard';
import { FeathersTracker } from './components/FeathersTracker';
import { AccessoriesTracker } from './components/AccessoriesTracker';
import { GearTracker } from './components/GearTracker';
import { FeatherPriceCalculator } from './components/FeatherPriceCalculator';
import { SubmitResultsButton } from './components/SubmitResultsButton';
import { Auth } from './components/Auth';
import { tr } from './i18n';
import type { Tab } from './types';

const TABS: { key: Tab; labelKey: Parameters<typeof tr>[1]; icon: string }[] = [
  { key: 'dashboard', labelKey: 'tabDashboard', icon: '📊' },
  { key: 'global', labelKey: 'tabGlobal', icon: '🌍' },
  { key: 'feathers', labelKey: 'tabFeathers', icon: '🪶' },
  { key: 'accessories', labelKey: 'tabAccessories', icon: '💍' },
  { key: 'gear', labelKey: 'tabGear', icon: '⚔️' },
  { key: 'calculator', labelKey: 'tabCalculator', icon: '🧮' },
];

export default function App() {
  const activeTab = useStore((s) => s.activeTab);
  const language = useStore((s) => s.language);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const setLanguage = useStore((s) => s.setLanguage);
  const resetAll = useStore((s) => s.resetAll);
  const getExportData = useStore((s) => s.getExportData);
  const importData = useStore((s) => s.importData);

  const [showReset, setShowReset] = useState(false);

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
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-aion-gold tracking-tight">
            {tr(language, 'appTitle')}
          </h1>
          <div className="flex gap-2 flex-wrap">
            <Auth />
            <SubmitResultsButton />
            <div className="flex border border-aion-border rounded-lg overflow-hidden">
              <button
                onClick={() => setLanguage('uk')}
                className={`px-2.5 py-1.5 text-xs transition ${
                  language === 'uk' ? 'bg-aion-row text-aion-gold' : 'text-aion-muted hover:bg-white/5'
                }`}
              >
                UA
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1.5 text-xs transition ${
                  language === 'en' ? 'bg-aion-row text-aion-gold' : 'text-aion-muted hover:bg-white/5'
                }`}
              >
                EN
              </button>
            </div>
            <button
              onClick={handleExport}
              className="px-3 py-1.5 rounded-lg border border-aion-gold text-aion-gold text-sm hover:bg-aion-gold/10 transition"
            >
              📤 {tr(language, 'export')}
            </button>
            <button
              onClick={handleImport}
              className="px-3 py-1.5 rounded-lg border border-blue-400 text-blue-400 text-sm hover:bg-blue-400/10 transition"
            >
              📥 {tr(language, 'import')}
            </button>
            <button
              onClick={() => setShowReset(true)}
              className="px-3 py-1.5 rounded-lg border border-aion-danger text-aion-danger text-sm hover:bg-aion-danger/10 transition"
            >
              🗑️ {tr(language, 'reset')}
            </button>
          </div>
        </header>

        {/* ── Tab Navigation ── */}
        <nav className="flex gap-1 mb-6 bg-aion-card rounded-xl p-1 overflow-x-auto border border-aion-border">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[100px] px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-aion-row text-aion-gold shadow-lg'
                  : 'text-aion-muted hover:text-aion-text hover:bg-white/5'
              }`}
            >
              <span className="mr-1.5">{tab.icon}</span>
              {tr(language, tab.labelKey)}
            </button>
          ))}
        </nav>

        {/* ── Content ── */}
        <main className="bg-aion-card border border-aion-border rounded-xl p-4 md:p-6">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'global' && <GlobalDashboard />}
          {activeTab === 'feathers' && <FeathersTracker />}
          {activeTab === 'accessories' && <AccessoriesTracker />}
          {activeTab === 'gear' && <GearTracker />}
          {activeTab === 'calculator' && <FeatherPriceCalculator />}
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
  );
}
