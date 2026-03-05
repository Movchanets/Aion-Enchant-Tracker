import { useState } from 'react';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';

export function SubmitResultsButton() {
  const [syncing, setSyncing] = useState(false);
  const unsynced = useStore((s) => s.unsyncedAttempts);
  const clearUnsyncedQueues = useStore((s) => s.clearUnsyncedQueues);

  const totalUnsynced =
    unsynced.feathers.length + unsynced.accessories.length + unsynced.gear.length;

  const handleSubmit = async () => {
    if (totalUnsynced === 0 || syncing) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert('Please log in with Discord before syncing.');
      return;
    }

    setSyncing(true);

    try {
      if (unsynced.feathers.length > 0) {
        const { error } = await supabase.from('feathers_attempts').insert(
          unsynced.feathers.map((a) => ({
            user_id: user.id,
            target_level: a.targetLevel,
            is_success: a.isSuccess,
            created_at: a.createdAt,
          })),
        );
        if (error) throw error;
      }

      if (unsynced.accessories.length > 0) {
        const { error } = await supabase.from('accessories_attempts').insert(
          unsynced.accessories.map((a) => ({
            user_id: user.id,
            target_level: a.targetLevel,
            is_success: a.isSuccess,
            created_at: a.createdAt,
          })),
        );
        if (error) throw error;
      }

      if (unsynced.gear.length > 0) {
        const { error } = await supabase.from('gear_attempts').insert(
          unsynced.gear.map((a) => ({
            user_id: user.id,
            target_level: a.targetLevel,
            is_success: a.isSuccess,
            item_grade: a.itemGrade,
            stone_level: a.stoneLevel,
            created_at: a.createdAt,
          })),
        );
        if (error) throw error;
      }

      clearUnsyncedQueues();
      alert('Results synced successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync data.';
      alert(message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSubmit}
      disabled={totalUnsynced === 0 || syncing}
      className="px-3 py-1.5 rounded-lg border border-emerald-400 text-emerald-300 text-sm hover:bg-emerald-400/10 disabled:opacity-40 disabled:cursor-not-allowed transition"
    >
      {syncing ? 'Syncing...' : `Submit Results (${totalUnsynced})`}
    </button>
  );
}
