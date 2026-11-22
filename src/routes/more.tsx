'use client';

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentSession, signOut } from '@/api/mockAuthApi';

export default function More() {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await getCurrentSession();
      if (!active) return;
      if (!session) {
        navigate('/login', { replace: true });
        return;
      }
      setEmail(session.email);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch {
      setSignOutError('Sign out failed. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
        <header className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">More</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your account details and sign out.</p>
        </header>

        <section aria-labelledby="account-heading" className="rounded-[var(--radius)] border bg-card p-4 shadow-sm sm:p-6">
          <h2 id="account-heading" className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account
          </h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading your account…</p>
          ) : (
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <dl className="min-w-0">
                <dt className="text-xs text-muted-foreground">Email</dt>
                <dd className="break-all text-sm">{email || '—'}</dd>
              </dl>
              <Link
                to="/profile"
                className="inline-flex w-full items-center justify-center rounded-[var(--radius)] border bg-background px-4 py-2 text-sm font-semibold transition-colors hover:bg-muted sm:w-auto"
              >
                Edit profile
              </Link>
            </div>
          )}
        </section>

        <section aria-labelledby="session-heading" className="rounded-[var(--radius)] border bg-card p-4 shadow-sm sm:p-6">
          <h2 id="session-heading" className="mb-2 text-base font-semibold">
            Session
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Signing out ends this session on this device. Your account data is kept.
          </p>

          {signOutError && (
            <div role="alert" className="mb-4 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {signOutError}
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isSigningOut}
            aria-busy={isSigningOut}
            className="inline-flex w-full items-center justify-center rounded-[var(--radius)] bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSigningOut ? 'Signing out…' : 'Log out'}
          </button>
        </section>
      </div>
    </main>
  );
}
