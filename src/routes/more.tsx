import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getAllAllocations } from '@/api/supabaseApi';
import { matchingCronService } from '@/api/matchingCronService';
import type { CronState } from '@/api/matchingCronService';
import type { MatchAllocation } from '@/api/types';
import { Button } from '@/components/ui/button';

const ALLOC_STATUS_BADGE: Record<string, string> = {
  proposed: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-200 text-gray-500',
};

const DELIVERY_BADGE: Record<string, { label: string; cls: string }> = {
  assigned: { label: '🚚 Volunteer Assigned', cls: 'bg-blue-100 text-blue-800' },
  accepted: { label: '✅ Accepted', cls: 'bg-blue-100 text-blue-800' },
  active: { label: '🔄 Active', cls: 'bg-yellow-100 text-yellow-800' },
  picked_up: { label: '📦 Picked Up', cls: 'bg-yellow-100 text-yellow-800' },
  in_transit: { label: '🚗 In Transit', cls: 'bg-orange-100 text-orange-800' },
  delivered: { label: '🎉 Delivered', cls: 'bg-green-100 text-green-800' },
  declined: { label: '⚠️ Declined', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: '✖ Cancelled', cls: 'bg-gray-100 text-gray-500' },
};

function AllocationRow({ alloc }: { alloc: MatchAllocation }) {
  const delivBadge = alloc.deliveryStatus && DELIVERY_BADGE[alloc.deliveryStatus]
    ? DELIVERY_BADGE[alloc.deliveryStatus]
    : null;

  return (
    <div className="rounded-[var(--radius)] border border-border bg-background p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-foreground text-sm">
          {alloc.foodDescription ?? `Donation #${alloc.donationId.slice(-6)}`}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ALLOC_STATUS_BADGE[alloc.status] ?? 'bg-muted text-muted-foreground'}`}
        >
          {alloc.status}
        </span>
        {delivBadge && (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${delivBadge.cls}`}>
            {delivBadge.label}
          </span>
        )}
        {!alloc.deliveryStatus && alloc.status === 'proposed' && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            ⏳ Awaiting Volunteer
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded bg-green-50 border border-green-200 p-2 text-center">
          <p className="text-muted-foreground font-medium">Veg (Pure)</p>
          <p className="text-lg font-bold text-green-700">{alloc.vegForPureVeg}</p>
        </div>
        <div className="rounded bg-orange-50 border border-orange-200 p-2 text-center">
          <p className="text-muted-foreground font-medium">Non-Veg</p>
          <p className="text-lg font-bold text-orange-700">{alloc.nonVegForFlex}</p>
        </div>
        <div className="rounded bg-lime-50 border border-lime-200 p-2 text-center">
          <p className="text-muted-foreground font-medium">Veg (Flex)</p>
          <p className="text-lg font-bold text-lime-700">{alloc.vegForFlex}</p>
        </div>
        <div className="rounded bg-primary/10 border border-primary/20 p-2 text-center">
          <p className="text-muted-foreground font-medium">Total</p>
          <p className="text-lg font-bold text-primary">{alloc.totalAllocated}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
        {alloc.pickupAddress && (
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0 text-green-600">📍</span>
            <div>
              <p className="font-semibold text-foreground">Pickup</p>
              <p>{alloc.pickupAddress}</p>
            </div>
          </div>
        )}
        {alloc.receivingAddress && (
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0 text-blue-600">🏁</span>
            <div>
              <p className="font-semibold text-foreground">Delivery To</p>
              <p>{alloc.receivingAddress}</p>
            </div>
          </div>
        )}
        {alloc.volunteerId && (
          <div className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">🧑‍🚀</span>
            <div>
              <p className="font-semibold text-foreground">Volunteer Assigned</p>
              <p className="text-foreground font-medium">{alloc.volunteerName ?? alloc.volunteerId.slice(-8)}</p>
              {alloc.vehicleType && <p className="capitalize">Vehicle: {alloc.vehicleType}</p>}
            </div>
          </div>
        )}
        <div className="flex items-start gap-1.5">
          <span className="mt-0.5 shrink-0">🕐</span>
          <div>
            <p className="font-semibold text-foreground">Matched At</p>
            <p>{new Date(alloc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function More() {
  const { session, profile, logout } = useSession();
  const navigate = useNavigate();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  const [allocations, setAllocations] = useState<MatchAllocation[]>([]);
  const [allocLoading, setAllocLoading] = useState(false);
  const [allocError, setAllocError] = useState<string | null>(null);

  // Real-time Cron State
  const [cronState, setCronState] = useState<CronState>(matchingCronService.getState());
  const [manualTriggering, setManualTriggering] = useState(false);

  const loadAllocations = useCallback(async () => {
    setAllocLoading(true);
    setAllocError(null);
    try {
      const res = await getAllAllocations();
      if (res.error) setAllocError(res.error.message);
      else setAllocations(res.data ?? []);
    } catch {
      setAllocError('Failed to load matching pairs.');
    } finally {
      setAllocLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAllocations();
    // Subscribe to cron state changes
    const unsub = matchingCronService.subscribe((state) => {
      setCronState(state);
    });

    // Refresh allocations whenever matching updates
    const handleUpdate = () => {
      void loadAllocations();
    };
    window.addEventListener('foodpulse:matching-updated', handleUpdate);

    return () => {
      unsub();
      window.removeEventListener('foodpulse:matching-updated', handleUpdate);
    };
  }, [loadAllocations]);

  async function handleLogout() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch {
      setSignOutError('Sign out failed. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

  const handleToggleCron = () => {
    if (cronState.isRunning) {
      matchingCronService.stop();
    } else {
      matchingCronService.start();
    }
  };

  const handleRunNow = async () => {
    setManualTriggering(true);
    try {
      await matchingCronService.runCycle('Manual Trigger');
      await loadAllocations();
    } finally {
      setManualTriggering(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-3xl min-w-0 space-y-6">
        <header className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">More & System Administration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Account settings, automated matching engine controls, and live network status.
          </p>
        </header>

        {/* ═══ AUTOMATED MATCHING CRON JOB CONTROLS ═══ */}
        <section
          aria-labelledby="cron-heading"
          className="rounded-[var(--radius)] border-2 border-primary/30 bg-card p-5 shadow-sm space-y-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <h2 id="cron-heading" className="text-base font-bold tracking-tight">
                  ⚡ Automated Matching Engine (Cron)
                </h2>
                {cronState.isRunning ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                    <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Cron Running (Active)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                    Cron Paused
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically pairs proposals with food requests every 10s and on real-time creation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={cronState.isRunning ? 'destructive' : 'default'}
                onClick={handleToggleCron}
              >
                {cronState.isRunning ? '⏸ Turn OFF Cron' : '▶ Turn ON Cron Job'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={manualTriggering}
                onClick={() => void handleRunNow()}
              >
                {manualTriggering ? 'Running…' : '🔄 Run Cycle Now'}
              </Button>
            </div>
          </div>

          {/* Engine Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="rounded-[var(--radius)] border bg-background p-2.5">
              <p className="text-muted-foreground font-medium">Status</p>
              <p className={`text-base font-bold mt-0.5 ${cronState.isRunning ? 'text-green-600' : 'text-muted-foreground'}`}>
                {cronState.isRunning ? 'Running' : 'Stopped'}
              </p>
            </div>
            <div className="rounded-[var(--radius)] border bg-background p-2.5">
              <p className="text-muted-foreground font-medium">Interval</p>
              <p className="text-base font-bold text-foreground mt-0.5">Every 10s + Realtime</p>
            </div>
            <div className="rounded-[var(--radius)] border bg-background p-2.5">
              <p className="text-muted-foreground font-medium">Cycles Run</p>
              <p className="text-base font-bold text-foreground mt-0.5">{cronState.stats.totalCycles}</p>
            </div>
            <div className="rounded-[var(--radius)] border bg-background p-2.5">
              <p className="text-muted-foreground font-medium">Matches Formed</p>
              <p className="text-base font-bold text-primary mt-0.5">{cronState.stats.totalMatches}</p>
            </div>
          </div>

          {/* Real-time Activity Log Terminal */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wider">
                Live Cron Activity Log
              </span>
              <button
                type="button"
                onClick={() => matchingCronService.clearLogs()}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Clear log
              </button>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-black/90 p-3 font-mono text-xs text-green-400 max-h-36 overflow-y-auto space-y-1">
              {cronState.logs.length === 0 ? (
                <p className="text-gray-500 italic">No activity yet. Turn on the cron job or click "Run Cycle Now".</p>
              ) : (
                cronState.logs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-gray-500 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={
                        log.type === 'error'
                          ? 'text-red-400 font-semibold'
                          : log.type === 'success'
                          ? 'text-emerald-300 font-semibold'
                          : log.type === 'warning'
                          ? 'text-yellow-300'
                          : 'text-gray-200'
                      }
                    >
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* ═══ NETWORK STATUS (All Allocations / Matching Pairs) ═══ */}
        <section
          aria-labelledby="network-heading"
          className="rounded-[var(--radius)] border bg-card shadow-sm"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-6 border-b border-border">
            <div>
              <h2 id="network-heading" className="text-base font-bold tracking-tight flex items-center gap-2">
                <span>🌐</span> All Matching Pairs & Allocations
                <span className="text-xs font-normal text-muted-foreground ml-1">(Live Network)</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every donor proposal matched to a receiver demand, with volunteer delivery routing.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void loadAllocations()}
              disabled={allocLoading}
            >
              {allocLoading ? 'Refreshing…' : '↻ Refresh Allocations'}
            </Button>
          </div>

          <div className="p-4 sm:p-6 space-y-3">
            {allocLoading ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Loading allocations…</p>
            ) : allocError ? (
              <p className="text-sm text-destructive">{allocError}</p>
            ) : allocations.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <p className="text-3xl">🤝</p>
                <p className="font-semibold text-foreground">No matching pairs yet</p>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Turn on the <strong>Automated Matching Engine</strong> above to automatically match active donations with food requests.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {allocations.length} active allocation{allocations.length > 1 ? 's' : ''} •{' '}
                  {allocations.reduce((s, a) => s + a.totalAllocated, 0)} total meals matched across the network
                </p>
                {allocations.map((alloc) => (
                  <AllocationRow key={alloc.id} alloc={alloc} />
                ))}
              </>
            )}
          </div>
        </section>

        {/* Account Info */}
        <section
          aria-labelledby="account-heading"
          className="rounded-[var(--radius)] border bg-card p-4 shadow-sm sm:p-6"
        >
          <h2
            id="account-heading"
            className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Account Details
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Full Name</dt>
              <dd className="break-all text-sm font-medium mt-0.5">{profile?.fullName || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Email</dt>
              <dd className="break-all text-sm font-medium mt-0.5">{session?.email || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">City</dt>
              <dd className="break-all text-sm font-medium mt-0.5">{profile?.city || '—'}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Role</dt>
              <dd className="break-all text-sm font-medium mt-0.5 capitalize">{profile?.role || 'user'}</dd>
            </div>
          </dl>
        </section>

        {/* Sign out section */}
        <section
          aria-labelledby="session-heading"
          className="rounded-[var(--radius)] border bg-card p-4 shadow-sm sm:p-6"
        >
          <h2 id="session-heading" className="mb-2 text-base font-semibold">
            Session
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Signing out ends your authenticated session on this device.
          </p>
          {signOutError && (
            <div
              role="alert"
              className="mb-4 rounded-[var(--radius)] border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {signOutError}
            </div>
          )}
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={isSigningOut}
          >
            {isSigningOut ? 'Signing out…' : 'Log out'}
          </Button>
        </section>
      </div>
    </main>
  );
}
