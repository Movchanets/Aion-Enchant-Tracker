import { useStore } from '../store/useStore';
import { FEATHER_MAX, ACCESSORY_MAX, getChance, getTotal, type AttemptRecord } from '../types';
import { tr } from '../i18n';

function TrackerCard({ title, icon, data, lang }: { title: string; icon: string; data: AttemptRecord; lang: 'uk' | 'en' }) {
  const total = getTotal(data);
  const chance = getChance(data);

  return (
    <div className="bg-aion-row border border-aion-border rounded-lg p-4">
      <div className="text-lg font-bold text-aion-gold mb-3">
        {icon} {title}
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-aion-muted">{tr(lang, 'totalAttempts')}</span>
          <span className="font-bold">{total}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-aion-muted">{tr(lang, 'successes')}</span>
          <span className="font-bold text-aion-success">{data.success}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-aion-muted">{tr(lang, 'fails')}</span>
          <span className="font-bold text-aion-danger">{data.fail}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-aion-border">
          <span className="text-aion-muted">{tr(lang, 'chance')}</span>
          <span className="font-bold text-aion-gold text-lg">{chance}%</span>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard ── */

export function Dashboard() {
  const lang = useStore((s) => s.language);
  const feathers = useStore((s) => s.feathers);
  const accessories = useStore((s) => s.accessories);
  const gear = useStore((s) => s.gear);

  const aggregate = (stats: Record<number, AttemptRecord>, max: number): AttemptRecord => {
    let success = 0;
    let fail = 0;
    for (let i = 1; i <= max; i++) {
      success += stats[i]?.success ?? 0;
      fail += stats[i]?.fail ?? 0;
    }
    return { success, fail };
  };

  const featherTotals = aggregate(feathers.stats, FEATHER_MAX);
  const accessoryTotals = aggregate(accessories.stats, ACCESSORY_MAX);

  const gearTotals: AttemptRecord = { success: 0, fail: 0 };
  for (const q of Object.values(gear.stats)) {
    for (const s of Object.values(q)) {
      for (const r of Object.values(s)) {
        gearTotals.success += r.success;
        gearTotals.fail += r.fail;
      }
    }
  }

  const hasAnyData =
    featherTotals.success + featherTotals.fail + accessoryTotals.success + accessoryTotals.fail + gearTotals.success + gearTotals.fail > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-aion-gold">📊 {tr(lang, 'dashboardTitle')}</h2>

      {/* Per-tracker summaries */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrackerCard title={lang === 'uk' ? 'Пера' : 'Feathers'} icon="🪶" data={featherTotals} lang={lang} />
        <TrackerCard title={lang === 'uk' ? 'Аксесуари' : 'Accessories'} icon="💍" data={accessoryTotals} lang={lang} />
        <TrackerCard title={lang === 'uk' ? 'Екіпірування' : 'Gear'} icon="⚔️" data={gearTotals} lang={lang} />
      </div>

      <div className="bg-aion-row border border-aion-border rounded-lg p-4">
        <h3 className="text-lg font-bold text-aion-gold mb-3">🪶 {tr(lang, 'featherChancesByStep')}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
          {Array.from({ length: FEATHER_MAX }, (_, i) => i + 1).map((step) => {
            const rec = feathers.stats[step] ?? { success: 0, fail: 0 };
            const total = rec.success + rec.fail;
            const chance = total > 0 ? `${((rec.success / total) * 100).toFixed(1)}%` : '—';
            return (
              <div key={step} className="bg-aion-bg/60 border border-aion-border rounded px-2 py-1.5">
                <div className="text-aion-muted text-xs">+{step - 1}→+{step}</div>
                <div className="font-bold text-aion-gold">{chance}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {!hasAnyData && (
        <div className="text-center py-8 text-aion-muted">
          <p className="text-lg mb-2">{tr(lang, 'noDataYet')}</p>
          <p className="text-sm">{tr(lang, 'startTrackingHint')}</p>
        </div>
      )}
    </div>
  );
}
