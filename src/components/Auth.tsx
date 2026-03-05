import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function Auth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(currentUser);
        setLoading(false);
      }
    };

    void loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleDiscordLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: {
        redirectTo:`${window.location.origin}/Aion-Enchant-Tracker/`,
      },
    });

    if (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      alert(error.message);
    }
  };

  if (loading) {
    return <div className="text-xs text-aion-muted">Checking auth...</div>;
  }

  if (!user) {
    return (
      <button
        onClick={handleDiscordLogin}
        className="px-3 py-1.5 rounded-lg border border-indigo-400 text-indigo-300 text-sm whitespace-nowrap hover:bg-indigo-400/15 transition"
      >
        Login with Discord
      </button>
    );
  }

  const discordName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    (user.user_metadata?.preferred_username as string | undefined) ||
    user.email ||
    'Discord User';

  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ||
    (user.user_metadata?.picture as string | undefined);

  return (
    <div className="max-w-full min-w-0 flex items-center gap-2 rounded-lg border border-aion-border bg-aion-row px-2 py-1.5">
      {avatarUrl ? (
        <img src={avatarUrl} alt={discordName} className="w-7 h-7 rounded-full border border-aion-border" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-aion-bg border border-aion-border" />
      )}
      <div className="text-xs leading-tight">
        <div className="text-aion-muted">Logged in</div>
        <div className="font-semibold text-aion-text max-w-[90px] sm:max-w-[130px] truncate">{discordName}</div>
      </div>
      <button
        onClick={handleLogout}
        className="ml-1 px-2 py-1 rounded border border-aion-border text-aion-muted text-xs whitespace-nowrap hover:bg-white/5 transition"
      >
        Logout
      </button>
    </div>
  );
}
