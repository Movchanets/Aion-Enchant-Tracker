import { useStore } from '../store/useStore';
import { FEATHER_MAX, getChance, getTotal } from '../types';
import { tr } from '../i18n';

export function FeathersTracker() {
  const lang = useStore((s) => s.language);
  const feathers = useStore((s) => s.feathers);
  const recordAttempt = useStore((s) => s.recordFeatherAttempt);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-aion-gold">🪶 {tr(lang, 'feathersTitle')}: +0 → +{FEATHER_MAX}</h2>
        <p className="text-sm text-aion-muted mt-1">
          {tr(lang, 'feathersHint')}
        </p>
      </div>

      {/* Grid */}
      <div className="space-y-2">
        {Array.from({ length: FEATHER_MAX }, (_, i) => i + 1).map((level) => {
          const data = feathers.stats[level];
          const total = getTotal(data);
          const chance = getChance(data);
          const hasPre = level === 1 || feathers.inventory[level - 1] > 0;

          return (
            <div
              key={level}
              className={`rounded-lg border border-aion-border p-3 transition-opacity ${
                hasPre ? 'bg-aion-row' : 'bg-aion-bg/50 opacity-50'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Level label */}
                <div className="font-bold text-aion-gold min-w-[70px]">
                  +{level - 1} → +{level}
                </div>

                {/* Inventory */}
                <div className="text-center min-w-[80px] text-xs text-aion-muted">
                  {level === 1 ? (
                    <>
                      {tr(lang, 'baseItems')}
                      <span className="block text-lg leading-tight text-aion-text">∞</span>
                    </>
                  ) : (
                    <>
                      {tr(lang, 'inStock')} +{level - 1}
                      <span className="block text-lg font-bold leading-tight text-aion-text">
                        {feathers.inventory[level - 1]}
                      </span>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    disabled={!hasPre}
                    onClick={() => recordAttempt(level, 'success')}
                    className="px-3 py-1.5 rounded border border-aion-success text-aion-success text-sm bg-aion-success/10 hover:bg-aion-success/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    {tr(lang, 'successBtn')}
                  </button>
                  <button
                    disabled={!hasPre}
                    onClick={() => recordAttempt(level, 'fail')}
                    className="px-3 py-1.5 rounded border border-aion-danger text-aion-danger text-sm bg-aion-danger/10 hover:bg-aion-danger/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    {tr(lang, 'breakBtn')}
                  </button>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-sm flex-1 justify-center min-w-[140px]">
                  <span className="text-aion-success">
                    ✓ <b>{data.success}</b>
                  </span>
                  <span className="text-aion-danger">
                    ✗ <b>{data.fail}</b>
                  </span>
                  <span className="text-aion-muted">
                    Σ <b>{total}</b>
                  </span>
                </div>

                {/* Chance */}
                <div className="font-bold text-lg text-aion-gold min-w-[60px] text-right">
                  {chance}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
