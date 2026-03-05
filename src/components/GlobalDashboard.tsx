import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_STONE_LEVELS, QUALITY_META, type ItemQuality } from '../types';

type GlobalRow = {
  target_level: number;
  total_attempts: number;
  successful_attempts: number;
  success_rate: number;
};

type GlobalGearRow = GlobalRow & {
  item_level: number;
  item_grade: string;
  stone_level: string;
};

function RateCell({ rate }: { rate: number }) {
  const normalized = Number.isFinite(rate) ? Math.max(0, Math.min(100, rate)) : 0;
  return (
    <div className="min-w-[180px]">
      <div className="h-2 rounded-full bg-aion-bg border border-aion-border overflow-hidden">
        <div className="h-full bg-aion-gold/80" style={{ width: `${normalized}%` }} />
      </div>
      <div className="text-xs text-aion-muted mt-1">{normalized.toFixed(2)}%</div>
    </div>
  );
}

export function GlobalDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feathers, setFeathers] = useState<GlobalRow[]>([]);
  const [accessories, setAccessories] = useState<GlobalRow[]>([]);
  const [gear, setGear] = useState<GlobalGearRow[]>([]);
  const [selectedGearItemLevel, setSelectedGearItemLevel] = useState<number>(65);
  const [selectedGearGrade, setSelectedGearGrade] = useState<ItemQuality>('purple');
  const [selectedGearStoneLevel, setSelectedGearStoneLevel] = useState<string>('1');
  const [selectedGearEnchantLevel, setSelectedGearEnchantLevel] = useState<number | 'all'>('all');

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    const [feathersRes, accessoriesRes, gearRes] = await Promise.all([
      supabase
        .from('global_feathers_stats')
        .select('*')
        .order('target_level', { ascending: true }),
      supabase
        .from('global_accessories_stats')
        .select('*')
        .order('target_level', { ascending: true }),
      supabase
        .from('global_gear_stats')
        .select('*')
        .order('item_level', { ascending: true })
        .order('item_grade', { ascending: true })
        .order('stone_level', { ascending: true })
        .order('target_level', { ascending: true }),
    ]);

    if (feathersRes.error || accessoriesRes.error || gearRes.error) {
      setError(feathersRes.error?.message || accessoriesRes.error?.message || gearRes.error?.message || 'Failed to load global stats.');
      setLoading(false);
      return;
    }

    setFeathers((feathersRes.data ?? []) as GlobalRow[]);
    setAccessories((accessoriesRes.data ?? []) as GlobalRow[]);
    const gearRows = (gearRes.data ?? []) as GlobalGearRow[];
    setGear(gearRows);
    if (gearRows.length > 0) {
      const itemLevels = Array.from(new Set(gearRows.map((r) => r.item_level))).sort((a, b) => a - b);
      setSelectedGearItemLevel(itemLevels[0]);
      const first = gearRows[0];
      setSelectedGearGrade(first.item_grade as ItemQuality);
      setSelectedGearStoneLevel(String(first.stone_level));
    }
    setLoading(false);
  };

  const gearItemLevels = useMemo(
    () => Array.from(new Set(gear.map((r) => r.item_level))).sort((a, b) => a - b),
    [gear],
  );

  const gearGrades = useMemo(
    () =>
      Array.from(
        new Set(
          gear
            .filter((r) => r.item_level === selectedGearItemLevel)
            .map((r) => r.item_grade as ItemQuality),
        ),
      ),
    [gear, selectedGearItemLevel],
  );

  const gearStoneLevels = useMemo(
    () =>
      Array.from(
        new Set(
          gear
            .filter(
              (r) =>
                r.item_level === selectedGearItemLevel &&
                r.item_grade === selectedGearGrade,
            )
            .map((r) => String(r.stone_level)),
        ),
      ).sort((a, b) => Number(a) - Number(b)),
    [gear, selectedGearItemLevel, selectedGearGrade],
  );

  const filteredGearRows = useMemo(() => {
    const rows = gear.filter(
      (r) =>
        r.item_level === selectedGearItemLevel &&
        r.item_grade === selectedGearGrade &&
        String(r.stone_level) === selectedGearStoneLevel,
    );
    if (selectedGearEnchantLevel === 'all') return rows;
    return rows.filter((r) => r.target_level === selectedGearEnchantLevel);
  }, [
    gear,
    selectedGearItemLevel,
    selectedGearGrade,
    selectedGearStoneLevel,
    selectedGearEnchantLevel,
  ]);

  useEffect(() => {
    void fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-aion-gold">Global Dashboard</h2>
        <button
          onClick={() => void fetchStats()}
          className="px-3 py-1.5 rounded-lg border border-aion-border text-aion-muted text-sm hover:bg-white/5 transition"
        >
          Refresh
        </button>
      </div>

      {loading && <p className="text-sm text-aion-muted">Loading community stats...</p>}
      {error && <p className="text-sm text-aion-danger">{error}</p>}

      {!loading && !error && (
        <>
          <section className="bg-aion-row border border-aion-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-aion-gold mb-3">Feathers</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-aion-muted border-b border-aion-border">
                  <tr>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Success</th>
                    <th className="py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {feathers.map((row) => (
                    <tr key={`f-${row.target_level}`} className="border-b border-aion-border/40 last:border-b-0">
                      <td className="py-2 pr-3 text-aion-text">+{row.target_level - 1}{' -> '}+{row.target_level}</td>
                      <td className="py-2 pr-3">{row.total_attempts}</td>
                      <td className="py-2 pr-3 text-aion-success">{row.successful_attempts}</td>
                      <td className="py-2"><RateCell rate={row.success_rate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-aion-row border border-aion-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-aion-gold mb-3">Accessories</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-aion-muted border-b border-aion-border">
                  <tr>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Success</th>
                    <th className="py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map((row) => (
                    <tr key={`a-${row.target_level}`} className="border-b border-aion-border/40 last:border-b-0">
                      <td className="py-2 pr-3 text-aion-text">+{row.target_level - 1}{' -> '}+{row.target_level}</td>
                      <td className="py-2 pr-3">{row.total_attempts}</td>
                      <td className="py-2 pr-3 text-aion-success">{row.successful_attempts}</td>
                      <td className="py-2"><RateCell rate={row.success_rate} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-aion-row border border-aion-border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-aion-gold mb-3">Gear</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <label className="text-xs text-aion-muted">
                Item Level
                <select
                  value={selectedGearItemLevel}
                  onChange={(e) => {
                    const nextLevel = Number(e.target.value);
                    setSelectedGearItemLevel(nextLevel);
                    const nextGrade = gear
                      .find((r) => r.item_level === nextLevel)
                      ?.item_grade as ItemQuality | undefined;
                    if (nextGrade) setSelectedGearGrade(nextGrade);
                    const nextStone = gear
                      .find(
                        (r) =>
                          r.item_level === nextLevel &&
                          r.item_grade === (nextGrade ?? selectedGearGrade),
                      )
                      ?.stone_level;
                    if (nextStone) setSelectedGearStoneLevel(String(nextStone));
                  }}
                  className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
                >
                  {gearItemLevels.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-aion-muted">
                Item Quality
                <select
                  value={selectedGearGrade}
                  onChange={(e) => {
                    const nextGrade = e.target.value as ItemQuality;
                    setSelectedGearGrade(nextGrade);
                    const nextStone = gear
                      .find(
                        (r) =>
                          r.item_level === selectedGearItemLevel &&
                          r.item_grade === nextGrade,
                      )
                      ?.stone_level;
                    if (nextStone) setSelectedGearStoneLevel(String(nextStone));
                  }}
                  className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
                >
                  {gearGrades.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade === 'purple' ? 'Mythical (Purple)' : QUALITY_META[grade]?.label ?? grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-aion-muted">
                Stone Level
                <select
                  value={selectedGearStoneLevel}
                  onChange={(e) => setSelectedGearStoneLevel(e.target.value)}
                  className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
                >
                  {(gearStoneLevels.length > 0 ? gearStoneLevels : ALL_STONE_LEVELS.map(String)).map((stone) => (
                    <option key={stone} value={stone}>
                      L{stone}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs text-aion-muted">
                Enchant Level
                <select
                  value={selectedGearEnchantLevel}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedGearEnchantLevel(value === 'all' ? 'all' : Number(value));
                  }}
                  className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
                >
                  <option value="all">All levels</option>
                  {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      +{lvl - 1} -&gt; +{lvl}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-aion-muted border-b border-aion-border">
                  <tr>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Success</th>
                    <th className="py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGearRows.map((row) => (
                    <tr
                      key={`g-${row.item_level}-${row.item_grade}-${row.stone_level}-${row.target_level}`}
                      className="border-b border-aion-border/40 last:border-b-0"
                    >
                      <td className="py-2 pr-3 text-aion-text">+{row.target_level - 1}{' -> '}+{row.target_level}</td>
                      <td className="py-2 pr-3">{row.total_attempts}</td>
                      <td className="py-2 pr-3 text-aion-success">{row.successful_attempts}</td>
                      <td className="py-2"><RateCell rate={row.success_rate} /></td>
                    </tr>
                  ))}
                  {filteredGearRows.length === 0 && (
                    <tr>
                      <td className="py-3 text-aion-muted" colSpan={4}>
                        No community data for selected gear filters yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
