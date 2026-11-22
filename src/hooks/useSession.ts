'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentSession, signOut } from '@/api/mockAuthApi';
import { getProfile } from '@/api/mockProfileApi';
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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const current = await getCurrentSession();
      if (!current) {
        setSession(null);
        setProfile(null);
        return;
      }

      const response = await getProfile(current.userId);
      setSession(current);
      if (response.error) {
        setProfile(null);
        setError(response.error.message);
        return;
      }
      setProfile(response.data);
    } catch {
      setSession(null);
      setProfile(null);
      setError(SESSION_LOAD_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await signOut();
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
