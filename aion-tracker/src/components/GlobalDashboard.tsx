import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type GlobalRow = {
  target_level: number;
  total_attempts: number;
  successful_attempts: number;
  success_rate: number;
};

type GlobalGearRow = GlobalRow & {
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
    setGear((gearRes.data ?? []) as GlobalGearRow[]);
    setLoading(false);
  };

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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-aion-muted border-b border-aion-border">
                  <tr>
                    <th className="py-2 pr-3">Grade</th>
                    <th className="py-2 pr-3">Stone</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Success</th>
                    <th className="py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {gear.map((row) => (
                    <tr
                      key={`g-${row.item_grade}-${row.stone_level}-${row.target_level}`}
                      className="border-b border-aion-border/40 last:border-b-0"
                    >
                      <td className="py-2 pr-3">{row.item_grade}</td>
                      <td className="py-2 pr-3">L{row.stone_level}</td>
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
        </>
      )}
    </div>
  );
}
