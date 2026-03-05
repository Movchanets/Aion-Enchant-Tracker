import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  ALL_STONE_LEVELS,
  ALL_SUPPLEMENTS,
  QUALITY_META,
  type ItemQuality,
  type SupplementTier,
} from '../types';

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
  supplement: SupplementTier;
};

type RawAttempt = {
  target_level: number;
  is_success: boolean;
};

type RawGearAttempt = RawAttempt & {
  item_level: number;
  item_grade: string;
  stone_level: string;
  supplement: SupplementTier | null;
};

type UserIdentityRow = {
  user_id: string;
  discord_name: string | null;
};

function normalizeSupplement(supplement: SupplementTier | null | undefined): SupplementTier {
  if (!supplement) return 'none';
  if (supplement === 'lesser' || supplement === 'regular' || supplement === 'greater') return supplement;
  return 'none';
}

function toRate(success: number, total: number): number {
  if (total <= 0) return 0;
  return Number(((success / total) * 100).toFixed(2));
}

function aggregateSimpleRows(rows: RawAttempt[]): GlobalRow[] {
  const byTarget = new Map<number, { total: number; success: number }>();
  for (const row of rows) {
    const acc = byTarget.get(row.target_level) ?? { total: 0, success: 0 };
    acc.total += 1;
    if (row.is_success) acc.success += 1;
    byTarget.set(row.target_level, acc);
  }
  return Array.from(byTarget.entries())
    .map(([target_level, acc]) => ({
      target_level,
      total_attempts: acc.total,
      successful_attempts: acc.success,
      success_rate: toRate(acc.success, acc.total),
    }))
    .sort((a, b) => a.target_level - b.target_level);
}

function aggregateGearRows(rows: RawGearAttempt[]): GlobalGearRow[] {
  const byKey = new Map<string, { total: number; success: number; row: Omit<GlobalGearRow, 'total_attempts' | 'successful_attempts' | 'success_rate'> }>();
  for (const row of rows) {
    const supplement = normalizeSupplement(row.supplement);
    const key = [row.item_level, row.item_grade, row.stone_level, supplement, row.target_level].join('|');
    const acc = byKey.get(key) ?? {
      total: 0,
      success: 0,
      row: {
        item_level: row.item_level,
        item_grade: row.item_grade,
        stone_level: row.stone_level,
        supplement,
        target_level: row.target_level,
      },
    };
    acc.total += 1;
    if (row.is_success) acc.success += 1;
    byKey.set(key, acc);
  }

  return Array.from(byKey.values())
    .map(({ total, success, row }) => ({
      ...row,
      total_attempts: total,
      successful_attempts: success,
      success_rate: toRate(success, total),
    }))
    .sort((a, b) =>
      a.item_level - b.item_level ||
      a.item_grade.localeCompare(b.item_grade) ||
      String(a.stone_level).localeCompare(String(b.stone_level)) ||
      ALL_SUPPLEMENTS.indexOf(a.supplement) - ALL_SUPPLEMENTS.indexOf(b.supplement) ||
      a.target_level - b.target_level,
    );
}

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
  const [userScope, setUserScope] = useState<'all' | 'current' | 'nickname'>('all');
  const [availableUsers, setAvailableUsers] = useState<UserIdentityRow[]>([]);
  const [selectedNicknameUserId, setSelectedNicknameUserId] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedGearItemLevel, setSelectedGearItemLevel] = useState<number>(65);
  const [selectedGearGrade, setSelectedGearGrade] = useState<ItemQuality>('purple');
  const [selectedGearStoneLevel, setSelectedGearStoneLevel] = useState<string>('1');
  const [selectedGearSupplement, setSelectedGearSupplement] = useState<SupplementTier | 'all'>('all');
  const [selectedGearEnchantLevel, setSelectedGearEnchantLevel] = useState<number | 'all'>('all');

  const fetchUsers = async () => {
    const [feathersUsersRes, accessoriesUsersRes, gearUsersRes] = await Promise.all([
      supabase.from('feathers_attempts').select('user_id,discord_name').order('created_at', { ascending: false }),
      supabase.from('accessories_attempts').select('user_id,discord_name').order('created_at', { ascending: false }),
      supabase.from('gear_attempts').select('user_id,discord_name').order('created_at', { ascending: false }),
    ]);

    if (feathersUsersRes.error || accessoriesUsersRes.error || gearUsersRes.error) {
      setError(
        feathersUsersRes.error?.message ||
          accessoriesUsersRes.error?.message ||
          gearUsersRes.error?.message ||
          'Failed to load users list.',
      );
      return;
    }

    const map = new Map<string, UserIdentityRow>();
    const allRows = [
      ...((feathersUsersRes.data ?? []) as UserIdentityRow[]),
      ...((accessoriesUsersRes.data ?? []) as UserIdentityRow[]),
      ...((gearUsersRes.data ?? []) as UserIdentityRow[]),
    ];

    for (const row of allRows) {
      const existing = map.get(row.user_id);
      if (!existing) {
        map.set(row.user_id, row);
        continue;
      }
      if (!existing.discord_name && row.discord_name) {
        map.set(row.user_id, row);
      }
    }

    const users = Array.from(map.values()).sort((a, b) => {
      const nameA = (a.discord_name ?? '').toLowerCase();
      const nameB = (b.discord_name ?? '').toLowerCase();
      if (nameA && nameB) return nameA.localeCompare(nameB);
      if (nameA) return -1;
      if (nameB) return 1;
      return a.user_id.localeCompare(b.user_id);
    });

    setAvailableUsers(users);
    if (!selectedNicknameUserId && users.length > 0) {
      setSelectedNicknameUserId(users[0].user_id);
    }
  };

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const selectedUserId =
      userScope === 'all'
        ? null
        : userScope === 'current'
          ? (user?.id ?? null)
          : (selectedNicknameUserId || null);

    if (userScope !== 'all' && !selectedUserId) {
      setError('Select a valid user for personal stats.');
      setLoading(false);
      return;
    }

    if (selectedUserId) {
      const [feathersRawRes, accessoriesRawRes, gearRawRes] = await Promise.all([
        supabase
          .from('feathers_attempts')
          .select('target_level,is_success')
          .eq('user_id', selectedUserId),
        supabase
          .from('accessories_attempts')
          .select('target_level,is_success')
          .eq('user_id', selectedUserId),
        supabase
          .from('gear_attempts')
          .select('item_level,item_grade,stone_level,target_level,is_success,supplement')
          .eq('user_id', selectedUserId),
      ]);

      if (feathersRawRes.error || accessoriesRawRes.error || gearRawRes.error) {
        setError(feathersRawRes.error?.message || accessoriesRawRes.error?.message || gearRawRes.error?.message || 'Failed to load user stats.');
        setLoading(false);
        return;
      }

      setFeathers(aggregateSimpleRows((feathersRawRes.data ?? []) as RawAttempt[]));
      setAccessories(aggregateSimpleRows((accessoriesRawRes.data ?? []) as RawAttempt[]));
      const gearRows = aggregateGearRows((gearRawRes.data ?? []) as RawGearAttempt[]);
      setGear(gearRows);
      if (gearRows.length > 0) {
        const itemLevels = Array.from(new Set(gearRows.map((r) => r.item_level))).sort((a, b) => a - b);
        setSelectedGearItemLevel(itemLevels[0]);
        const first = gearRows[0];
        setSelectedGearGrade(first.item_grade as ItemQuality);
        setSelectedGearStoneLevel(String(first.stone_level));
        setSelectedGearSupplement(first.supplement);
      }
      setLoading(false);
      return;
    }

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
        .order('supplement', { ascending: true })
        .order('target_level', { ascending: true }),
    ]);

    if (feathersRes.error || accessoriesRes.error || gearRes.error) {
      setError(feathersRes.error?.message || accessoriesRes.error?.message || gearRes.error?.message || 'Failed to load global stats.');
      setLoading(false);
      return;
    }

    setFeathers((feathersRes.data ?? []) as GlobalRow[]);
    setAccessories((accessoriesRes.data ?? []) as GlobalRow[]);
    const gearRows = ((gearRes.data ?? []) as Array<GlobalGearRow & { supplement?: SupplementTier }>).map((row) => ({
      ...row,
      supplement: normalizeSupplement(row.supplement),
    }));
    setGear(gearRows);
    if (gearRows.length > 0) {
      const itemLevels = Array.from(new Set(gearRows.map((r) => r.item_level))).sort((a, b) => a - b);
      setSelectedGearItemLevel(itemLevels[0]);
      const first = gearRows[0];
      setSelectedGearGrade(first.item_grade as ItemQuality);
      setSelectedGearStoneLevel(String(first.stone_level));
      setSelectedGearSupplement(first.supplement);
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

  const gearSupplements = useMemo(() => {
    const supplements = Array.from(
      new Set(
        gear
          .filter(
            (r) =>
              r.item_level === selectedGearItemLevel &&
              r.item_grade === selectedGearGrade &&
              String(r.stone_level) === selectedGearStoneLevel,
          )
          .map((r) => normalizeSupplement(r.supplement)),
      ),
    );
    return supplements.sort((a, b) => ALL_SUPPLEMENTS.indexOf(a) - ALL_SUPPLEMENTS.indexOf(b));
  }, [gear, selectedGearItemLevel, selectedGearGrade, selectedGearStoneLevel]);

  const filteredGearRows = useMemo(() => {
    const rows = gear.filter(
      (r) =>
        r.item_level === selectedGearItemLevel &&
        r.item_grade === selectedGearGrade &&
        String(r.stone_level) === selectedGearStoneLevel &&
        (selectedGearSupplement === 'all' || r.supplement === selectedGearSupplement),
    );
    if (selectedGearEnchantLevel === 'all') return rows;
    return rows.filter((r) => r.target_level === selectedGearEnchantLevel);
  }, [
    gear,
    selectedGearItemLevel,
    selectedGearGrade,
    selectedGearStoneLevel,
    selectedGearSupplement,
    selectedGearEnchantLevel,
  ]);

  useEffect(() => {
    void fetchUsers();
  }, []);

  useEffect(() => {
    void fetchStats();
  }, [userScope, selectedNicknameUserId]);

  const selectedNicknameUser = useMemo(
    () => availableUsers.find((u) => u.user_id === selectedNicknameUserId) ?? null,
    [availableUsers, selectedNicknameUserId],
  );

  const formatUserLabel = (user: UserIdentityRow): string => {
    const shortId = user.user_id.slice(0, 8);
    return user.discord_name ? `${user.discord_name} (${shortId}...)` : `Unknown (${shortId}...)`;
  };

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

      <section className="bg-aion-row border border-aion-border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-aion-gold">Data Scope</h3>
          <span className="text-xs text-aion-muted">Filter global stats by user</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <label className="text-xs text-aion-muted">
            Scope
            <select
              value={userScope}
              onChange={(e) => setUserScope(e.target.value as 'all' | 'current' | 'nickname')}
              className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
            >
              <option value="all">All users</option>
              <option value="current">Current user</option>
              <option value="nickname">Discord nickname</option>
            </select>
          </label>

          {userScope === 'nickname' && (
            <label className="text-xs text-aion-muted">
              Discord user
              <select
                value={selectedNicknameUserId}
                onChange={(e) => setSelectedNicknameUserId(e.target.value)}
                className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
              >
                {availableUsers.length === 0 && <option value="">No users found</option>}
                {availableUsers.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {formatUserLabel(u)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {userScope === 'current' && (
            <div className="text-xs text-aion-muted self-end">
              Current user ID: <span className="text-aion-text">{currentUserId ?? 'Not logged in'}</span>
            </div>
          )}

          {userScope === 'nickname' && selectedNicknameUser && (
            <div className="text-xs text-aion-muted self-end">
              Selected: <span className="text-aion-text">{formatUserLabel(selectedNicknameUser)}</span>
            </div>
          )}
        </div>
      </section>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
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
                Supplement
                <select
                  value={selectedGearSupplement}
                  onChange={(e) => setSelectedGearSupplement(e.target.value as SupplementTier | 'all')}
                  className="mt-1 w-full bg-aion-bg/70 border border-aion-border rounded px-2 py-1.5 outline-none focus:border-aion-gold"
                >
                  <option value="all">All supplements</option>
                  {(gearSupplements.length > 0 ? gearSupplements : ALL_SUPPLEMENTS).map((supplement) => (
                    <option key={supplement} value={supplement}>
                      {supplement}
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
                    <th className="py-2 pr-3">Supplement</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Total</th>
                    <th className="py-2 pr-3">Success</th>
                    <th className="py-2">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGearRows.map((row) => (
                    <tr
                      key={`g-${row.item_level}-${row.item_grade}-${row.stone_level}-${row.supplement}-${row.target_level}`}
                      className="border-b border-aion-border/40 last:border-b-0"
                    >
                      <td className="py-2 pr-3 text-aion-text capitalize">{row.supplement}</td>
                      <td className="py-2 pr-3 text-aion-text">+{row.target_level - 1}{' -> '}+{row.target_level}</td>
                      <td className="py-2 pr-3">{row.total_attempts}</td>
                      <td className="py-2 pr-3 text-aion-success">{row.successful_attempts}</td>
                      <td className="py-2"><RateCell rate={row.success_rate} /></td>
                    </tr>
                  ))}
                  {filteredGearRows.length === 0 && (
                    <tr>
                      <td className="py-3 text-aion-muted" colSpan={5}>
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
