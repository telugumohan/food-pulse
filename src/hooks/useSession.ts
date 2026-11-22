import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getCurrentSession, signOut as mockSignOut } from '@/api/mockAuthApi';
import { getProfile } from '@/api/supabaseApi';
import type { MockSession, Profile } from '@/api/types';

export interface UseSessionResult {
  session: MockSession | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const SESSION_LOAD_ERROR = 'We could not load your session. Please try again.';

export function useSession(): UseSessionResult {
  const [session, setSession] = useState<MockSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileForUser = useCallback(async (userId: string, email: string) => {
    try {
      const response = await getProfile(userId);
      setSession({
        userId,
        email,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (response.error) {
        setProfile(null);
        setError(response.error.message);
      } else {
        setProfile(response.data);
      }
    } catch {
      setError(SESSION_LOAD_ERROR);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try Supabase Auth session first
      const { data: supaSessionData } = await supabase.auth.getSession();
      const supaUser = supaSessionData?.session?.user;

      if (supaUser) {
        await fetchProfileForUser(supaUser.id, supaUser.email ?? '');
        return;
      }

      // 2. Fall back to local mock session if present
      const current = await getCurrentSession();
      if (!current) {
        setSession(null);
        setProfile(null);
        return;
      }

      await fetchProfileForUser(current.userId, current.email);
    } catch {
      setSession(null);
      setProfile(null);
      setError(SESSION_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, [fetchProfileForUser]);

  useEffect(() => {
    void refresh();

    // PRD §4.1: Subscribe to supabase.auth.onAuthStateChange
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (newSession?.user) {
        void fetchProfileForUser(newSession.user.id, newSession.user.email ?? '');
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh, fetchProfileForUser]);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore if offline
    }
    await mockSignOut();
    setSession(null);
    setProfile(null);
    setError(null);
  }, []);

  return useMemo(
    () => ({
      session,
      profile,
      loading,
      error,
      refresh,
      logout,
    }),
    [session, profile, loading, error, refresh, logout],
  );
}

export default useSession;
