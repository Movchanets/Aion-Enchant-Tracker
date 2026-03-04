import { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { tr } from '../i18n';

function parseCurrency(raw: string): number {
  if (!raw) return 0;
  const normalized = raw.toLowerCase().replace(/,/g, '.').replace(/\s/g, '');
  const match = normalized.match(/^([\d.]+)([kк]*)$/);
  if (!match) return Number.parseFloat(normalized) || 0;

  let value = Number.parseFloat(match[1]);
  const suffixLength = match[2].length;

  if (suffixLength === 1) value *= 1_000;
  else if (suffixLength === 2) value *= 1_000_000;
  else if (suffixLength === 3) value *= 1_000_000_000;

  return value;
}

function formatCurrency(num: number, locale: string): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })} ккк`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 2 })} кк`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toLocaleString(locale, { maximumFractionDigits: 2 })} к`;
  }
  return Math.round(num).toLocaleString(locale);
}

export function FeatherPriceCalculator() {
  const lang = useStore((s) => s.language);
  const featherStats = useStore((s) => s.feathers.stats);

  const [targetLevel, setTargetLevel] = useState(5);
  const [waterPriceInput, setWaterPriceInput] = useState('35кк');
  const [featherPriceInput, setFeatherPriceInput] = useState('385кк');

  const locale = lang === 'uk' ? 'uk-UA' : 'en-US';

  const result = useMemo(() => {
    const waterPrice = parseCurrency(waterPriceInput);
    const featherPrice = parseCurrency(featherPriceInput);

    let expectedCost = featherPrice;
    let expectedWater = 0;
    let chanceProduct = 1;
    let hasMissingStepChance = false;

    const stepChances: Array<{ step: number; chance: number }> = [];

    for (let step = 1; step <= targetLevel; step++) {
      const rec = featherStats[step] ?? { success: 0, fail: 0 };
      const total = rec.success + rec.fail;
      const chance = total > 0 ? rec.success / total : 0;

      stepChances.push({ step, chance });

      if (chance <= 0) {
        hasMissingStepChance = true;
        continue;
      }

      expectedCost = (expectedCost + waterPrice) / chance;
      expectedWater = (expectedWater + 1) / chance;
      chanceProduct *= chance;
    }

    const expectedFeathers = chanceProduct > 0 ? 1 / chanceProduct : 0;

    return {
      stepChances,
      hasMissingStepChance,
      expectedCost,
      expectedWater,
      expectedFeathers,
    };
  }, [targetLevel, waterPriceInput, featherPriceInput, featherStats]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-aion-gold">🧮 {tr(lang, 'calculatorTitle')}</h2>
        <p className="text-sm text-aion-muted mt-1">{tr(lang, 'calculatorHint')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-sm">
          <div className="text-aion-muted mb-1">{tr(lang, 'targetEnchant')} (+1...+10)</div>
          <input
            type="number"
            min={1}
            max={10}
            value={targetLevel}
            onChange={(e) => setTargetLevel(Math.min(10, Math.max(1, Number(e.target.value) || 1)))}
            className="w-full bg-aion-row border border-aion-border rounded px-3 py-2 outline-none focus:border-aion-gold"
          />
        </label>

        <label className="text-sm">
          <div className="text-aion-muted mb-1">{tr(lang, 'waterPrice')}</div>
          <input
            value={waterPriceInput}
            onChange={(e) => setWaterPriceInput(e.target.value)}
            className="w-full bg-aion-row border border-aion-border rounded px-3 py-2 outline-none focus:border-aion-gold"
          />
        </label>

        <label className="text-sm">
          <div className="text-aion-muted mb-1">{tr(lang, 'baseFeatherPrice')}</div>
          <input
            value={featherPriceInput}
            onChange={(e) => setFeatherPriceInput(e.target.value)}
            className="w-full bg-aion-row border border-aion-border rounded px-3 py-2 outline-none focus:border-aion-gold"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-aion-row border border-aion-border rounded-lg p-4">
          <div className="text-xs text-aion-muted mb-1">{tr(lang, 'avgFeathersNeeded')}</div>
          <div className="text-2xl font-bold text-aion-gold">
            {result.hasMissingStepChance
              ? '—'
              : result.expectedFeathers.toLocaleString(locale, { maximumFractionDigits: 1 })}
          </div>
        </div>

        <div className="bg-aion-row border border-aion-border rounded-lg p-4">
          <div className="text-xs text-aion-muted mb-1">{tr(lang, 'avgWaterNeeded')}</div>
          <div className="text-2xl font-bold text-aion-gold">
            {result.hasMissingStepChance
              ? '—'
              : result.expectedWater.toLocaleString(locale, { maximumFractionDigits: 1 })}
          </div>
        </div>

        <div className="bg-aion-row border border-aion-border rounded-lg p-4">
          <div className="text-xs text-aion-muted mb-1">{tr(lang, 'estTotalCost')}</div>
          <div className="text-2xl font-bold text-aion-success">
            {result.hasMissingStepChance ? '—' : formatCurrency(result.expectedCost, locale)}
          </div>
        </div>
      </div>

      <div className="bg-aion-row border border-aion-border rounded-lg p-4">
        <div className="text-sm font-medium text-aion-gold mb-2">{tr(lang, 'featherChancesByStep')}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-sm">
          {result.stepChances.map((s) => (
            <div key={s.step} className="bg-aion-bg/50 rounded border border-aion-border px-2 py-1.5">
              +{s.step - 1}→+{s.step}:{' '}
              <span className={s.chance > 0 ? 'text-aion-gold' : 'text-aion-danger'}>
                {s.chance > 0 ? `${(s.chance * 100).toFixed(1)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {result.hasMissingStepChance && (
        <div className="text-sm text-aion-danger bg-aion-danger/10 border border-aion-danger/50 rounded-lg px-3 py-2">
          {tr(lang, 'missingStepData')}
        </div>
      )}
    </div>
  );
}
