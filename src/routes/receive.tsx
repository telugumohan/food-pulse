import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getReceiverProfile, listFoodRequests, getRequestAllocations } from '@/api/supabaseApi';
import type { FoodRequest, ReceiverProfile, MatchAllocation } from '@/api/types';
import CapabilitySetupCard from '@/components/CapabilitySetupCard';
import { Button } from '@/components/ui/button';

const DELIVERY_BADGE: Record<string, { label: string; cls: string }> = {
  assigned: { label: '🚚 Volunteer Assigned', cls: 'bg-blue-100 text-blue-800' },
  accepted: { label: '✅ Volunteer Accepted', cls: 'bg-blue-100 text-blue-800' },
  picked_up: { label: '📦 Food Picked Up', cls: 'bg-yellow-100 text-yellow-800' },
  in_transit: { label: '🚗 In Transit', cls: 'bg-orange-100 text-orange-800' },
  delivered: { label: '🎉 Delivered!', cls: 'bg-green-100 text-green-800' },
};

function RequestMatchStatus({ requestId }: { requestId: string }) {
  const [allocations, setAllocations] = useState<MatchAllocation[]>([]);
  useEffect(() => {
    getRequestAllocations(requestId).then((r) => {
      if (r.data) setAllocations(r.data);
    });
  }, [requestId]);

  if (allocations.length === 0) return null;

  const totalAllocated = allocations.reduce((s, a) => s + a.totalAllocated, 0);
  const latestStatus = allocations.map((a) => a.deliveryStatus).filter(Boolean).at(-1);
  const badge = latestStatus && DELIVERY_BADGE[latestStatus] ? DELIVERY_BADGE[latestStatus] : null;

  return (
    <div className="flex gap-2 flex-wrap pt-1">
      {totalAllocated > 0 && (
        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
          🤝 {totalAllocated} meals matched from {allocations.length} donor{allocations.length > 1 ? 's' : ''}
        </span>
      )}
      {badge && (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
          {badge.label}
        </span>
      )}
      {!latestStatus && (
        <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
          ⏳ Awaiting Delivery Assignment
        </span>
      )}
    </div>
  );
}

export default function ReceivePage() {
  const { session } = useSession();
  const [profile, setProfile] = useState<ReceiverProfile | null>(null);
  const [requests, setRequests] = useState<FoodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const pRes = await getReceiverProfile(session.userId);
      if (pRes.error) {
        setError(pRes.error.message);
        setLoading(false);
        return;
      }
      setProfile(pRes.data);

      if (pRes.data) {
        const rRes = await listFoodRequests(session.userId);
        if (rRes.error) {
          setError(rRes.error.message);
        } else {
          setRequests(rRes.data ?? []);
        }
      }
    } catch {
      setError('Could not load receiver information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [session?.userId]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground">
        <p className="text-sm text-muted-foreground">Loading receiver profile…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-4">
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
        <Button onClick={() => void loadData()} variant="outline">
          Retry
        </Button>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Receive Food</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Request meals for your shelter, community kitchen, or charitable organization.
          </p>
        </div>
        <CapabilitySetupCard
          title="Want to receive food?"
          description="Register your shelter, NGO, community kitchen, or distribution center to request surplus food portions."
          yesLabel="Yes, set up receiver"
          yesTo="/receive/onboarding"
          notNowLabel="Not now"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Food Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organization: <span className="font-semibold text-foreground">{profile.organizationName}</span> ({profile.city})
          </p>
        </div>
        <Button asChild>
          <Link to="/receive/create">+ Create Food Request</Link>
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center space-y-3">
          <p className="text-base font-semibold">No food requests created yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When your organization needs meal supplies, create a request specifying total meals and pure vegetarian requirements.
          </p>
          <Button asChild variant="outline">
            <Link to="/receive/create">Create your first request</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => {
            const isFulfilled = req.remainingTotalMeals <= 0;
            const isExpired = !isFulfilled && Date.parse(req.neededBeforeAt) <= Date.now();
            const statusLabel = isFulfilled ? 'Fulfilled' : isExpired ? 'Expired' : 'Active';
            const statusClass = isFulfilled
              ? 'bg-secondary text-secondary-foreground'
              : isExpired
              ? 'bg-destructive/10 text-destructive'
              : 'bg-primary/10 text-primary';
            const matchedTotal = req.initialTotalMeals - req.remainingTotalMeals;
            const flexibleDemand = Math.max(req.remainingTotalMeals - req.remainingPureVegMeals, 0);

            return (
              <article
                key={req.id}
                className="rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Needed Before
                    </span>
                    <p className="text-base font-semibold text-foreground mt-0.5">
                      {new Date(req.neededBeforeAt).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Delivery to: {req.receivingAddress}, {req.receivingCity}
                    </p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Match progress */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground uppercase tracking-wide">Fulfillment Progress</span>
                    <span className="font-bold text-foreground">
                      {matchedTotal}/{req.initialTotalMeals} meals matched
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: req.initialTotalMeals > 0
                          ? `${Math.min(100, (matchedTotal / req.initialTotalMeals) * 100)}%`
                          : '0%',
                      }}
                    />
                  </div>
                  <RequestMatchStatus requestId={req.id} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-[var(--radius)] border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Total Meals</p>
                    <p className="text-xl font-bold text-foreground mt-1">{req.remainingTotalMeals}</p>
                    <p className="text-xs text-muted-foreground">of {req.initialTotalMeals} requested</p>
                  </div>
                  <div className="rounded-[var(--radius)] border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Pure Vegetarian</p>
                    <p className="text-xl font-bold text-foreground mt-1">{req.remainingPureVegMeals}</p>
                    <p className="text-xs text-muted-foreground">of {req.initialPureVegMeals} requested</p>
                  </div>
                  <div className="rounded-[var(--radius)] border border-border bg-background p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Flexible Remaining</p>
                    <p className="text-xl font-bold text-foreground mt-1">{flexibleDemand}</p>
                    <p className="text-xs text-muted-foreground">Veg or Non-Veg accepted</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
