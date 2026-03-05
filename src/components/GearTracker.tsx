import { useStore } from '../store/useStore';
import {
  GEAR_MAX,
  ALL_QUALITIES,
  ALL_STONE_LEVELS,
  QUALITY_META,
  getChance,
  getTotal,
  type ItemQuality,
  type StoneLevel,
} from '../types';
import { tr } from '../i18n';

export function GearTracker() {
  const lang = useStore((s) => s.language);
  const gear = useStore((s) => s.gear);
  const recordAttempt = useStore((s) => s.recordGearAttempt);
  const setQuality = useStore((s) => s.setGearQuality);
  const setStoneLevel = useStore((s) => s.setGearStoneLevel);
  const setGearItemLevel = useStore((s) => s.setGearItemLevel);

  const { selectedQuality, selectedStoneLevel, selectedItemLevel, stats, inventory, critByItemLevel } = gear;

  const getRecord = (
    quality: ItemQuality,
    stone: StoneLevel,
    level: number,
  ): { success: number; fail: number } => {
    const record = stats[quality]?.[stone]?.[level];
    return {
      success: record?.success ?? 0,
      fail: record?.fail ?? 0,
    };
  };

  const critForItemLevel = critByItemLevel[selectedItemLevel] ?? { successTotal: 0, critTotal: 0 };
  const globalCritChance =
    critForItemLevel.successTotal > 0
      ? ((critForItemLevel.critTotal / critForItemLevel.successTotal) * 100).toFixed(1)
      : '0.0';

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-aion-gold">⚔️ {tr(lang, 'gearTitle')}: +0 → +{GEAR_MAX}</h2>
        <p className="text-sm text-aion-muted mt-1">
          {tr(lang, 'gearHint')}
        </p>
      </div>

      {/* ── Selectors ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        {/* Quality */}
        <div className="p-3 bg-aion-row rounded-lg border border-aion-border">
          <div className="text-xs text-aion-muted mb-2">{tr(lang, 'quality')}</div>
          <div className="flex flex-wrap gap-1.5">
            {ALL_QUALITIES.map((q) => {
              const meta = QUALITY_META[q];
              const isActive = selectedQuality === q;
              return (
                <button
                  key={q}
                  onClick={() => setQuality(q)}
                  className={`px-2.5 py-1 rounded text-xs font-medium border transition ${
                    isActive
                      ? 'bg-white/10 shadow-sm'
                      : 'border-aion-border text-aion-muted hover:bg-white/5'
                  }`}
                  style={{
                    borderColor: isActive ? meta.color : undefined,
                    color: isActive ? meta.color : undefined,
                  }}
                >
                  {lang === 'uk' ? meta.labelUk : meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stone Level */}
        <div className="p-3 bg-aion-row rounded-lg border border-aion-border">
          <div className="text-xs text-aion-muted mb-2">{tr(lang, 'stoneLevel')}</div>
          <div className="flex gap-1.5">
            {ALL_STONE_LEVELS.map((sl) => (
              <button
                key={sl}
                onClick={() => setStoneLevel(sl)}
                className={`px-3 py-1 rounded text-sm font-medium border transition ${
                  selectedStoneLevel === sl
                    ? 'border-aion-gold text-aion-gold bg-aion-gold/15'
                    : 'border-aion-border text-aion-muted hover:bg-white/5'
                }`}
              >
                L{sl}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-aion-row rounded-lg border border-aion-border">
          <div className="text-xs text-aion-muted mb-2">{tr(lang, 'itemLevel')}</div>
          <input
            type="number"
            min={1}
            max={65}
            value={selectedItemLevel}
            onChange={(e) => {
              const val = Number(e.target.value) || 1;
              setGearItemLevel(Math.min(65, Math.max(1, val)));
            }}
            className="w-full bg-aion-bg/70 border border-aion-border rounded px-2.5 py-1.5 outline-none focus:border-aion-gold"
          />
        </div>
      </div>

      {/* Current filter label */}
      <div className="text-sm text-aion-muted mb-3">
        {tr(lang, 'filter')}:{' '}
        <span style={{ color: QUALITY_META[selectedQuality].color }} className="font-medium">
          {lang === 'uk' ? QUALITY_META[selectedQuality].labelUk : QUALITY_META[selectedQuality].label}
        </span>
        {' + '}
        <span className="text-aion-gold font-medium">Камінь L{selectedStoneLevel}</span>
      </div>

      <div className="mb-3 rounded-lg border border-aion-border bg-aion-row px-3 py-2 text-sm">
        <span className="text-aion-muted">{tr(lang, 'globalCritChance')} (iLvl {selectedItemLevel}): </span>
        <span className="font-bold text-aion-gold">{globalCritChance}%</span>
        <span className="text-aion-muted ml-2">({critForItemLevel.critTotal}/{critForItemLevel.successTotal})</span>
      </div>

      {/* ── Enchantment grid ── */}
      <div className="space-y-2">
        {Array.from({ length: GEAR_MAX }, (_, i) => i + 1).map((level) => {
          const record = getRecord(selectedQuality, selectedStoneLevel, level);
          const total = getTotal(record);
          const chance = getChance(record);
          const hasPre = level === 1 || (inventory[selectedQuality]?.[level - 1] ?? 0) > 0;
          const critEnabled = level - 1 < 10;

          return (
            <div
              key={level}
              className={`rounded-lg border border-aion-border p-3 ${
                hasPre ? 'bg-aion-row' : 'bg-aion-bg/50 opacity-50'
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                {/* Level label */}
                <div className="font-bold text-aion-gold min-w-[70px]">
                  +{level - 1} → +{level}
                </div>

                <div className="text-center min-w-[90px] text-xs text-aion-muted">
                  {level === 1 ? (
                    <>
                      {tr(lang, 'baseItems')}
                      <span className="block text-lg leading-tight text-aion-text">∞</span>
                    </>
                  ) : (
                    <>
                      {tr(lang, 'inStock')} +{level - 1}
                      <span className="block text-lg font-bold leading-tight text-aion-text">
                        {inventory[selectedQuality]?.[level - 1] ?? 0}
                      </span>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    disabled={!hasPre}
                    onClick={() =>
                      recordAttempt(selectedQuality, selectedStoneLevel, level, 'success')
                    }
                    className="px-3 py-1.5 rounded border border-aion-success text-aion-success text-sm bg-aion-success/10 hover:bg-aion-success/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    {tr(lang, 'successBtn')}
                  </button>
                  <button
                    disabled={!hasPre}
                    onClick={() =>
                      recordAttempt(selectedQuality, selectedStoneLevel, level, 'fail')
                    }
                    className="px-3 py-1.5 rounded border border-aion-danger text-aion-danger text-sm bg-aion-danger/10 hover:bg-aion-danger/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    {tr(lang, 'failBtn')}
                  </button>
                </div>

                <div className="w-full border-t border-aion-border/70 pt-2 mt-1">
                  <div className="text-xs text-aion-muted mb-1">{tr(lang, 'critSection')}</div>
                  {!critEnabled && (
                    <div className="text-xs text-aion-muted mb-1">{tr(lang, 'highEnchantNoCritHint')}</div>
                  )}
                  <div className="flex gap-2">
                    <button
                      disabled={!hasPre || !critEnabled}
                      onClick={() =>
                        recordAttempt(selectedQuality, selectedStoneLevel, level, 'success', 'crit2')
                      }
                      className="px-3 py-1 rounded border border-blue-400 text-blue-300 text-xs bg-blue-400/10 hover:bg-blue-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      {tr(lang, 'critPlus2')}
                    </button>
                    <button
                      disabled={!hasPre || !critEnabled}
                      onClick={() =>
                        recordAttempt(selectedQuality, selectedStoneLevel, level, 'success', 'crit3')
                      }
                      className="px-3 py-1 rounded border border-purple-400 text-purple-300 text-xs bg-purple-400/10 hover:bg-purple-400/20 disabled:opacity-30 disabled:cursor-not-allowed transition"
                    >
                      {tr(lang, 'critPlus3')}
                    </button>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-3 text-sm flex-1 justify-center min-w-[140px]">
                  <span className="text-aion-success">
                    ✓ <b>{record.success}</b>
                  </span>
                  <span className="text-aion-danger">
                    ✗ <b>{record.fail}</b>
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
