import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getDashboardSummary } from '@/api/supabaseApi';
import type { DashboardSummary } from '@/api/types';
import SummaryCard from '@/components/SummaryCard';
import PeriodSelector, { type PeriodValue } from '@/components/PeriodSelector';
import CapabilitySetupCard from '@/components/CapabilitySetupCard';
import VolunteerServiceCard from '@/components/VolunteerServiceCard';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { session, profile } = useSession();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [period, setPeriod] = useState<PeriodValue>('last7');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getDashboardSummary(session.userId);
      if (res.error) {
        setError(res.error.message);
      } else {
        setSummary(res.data);
      }
    } catch {
      setError('Unable to load dashboard data. Please try again.');
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
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </main>
    );
  }

  if (error || !summary) {
    return (
      <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-4">
        <div className="rounded-[var(--radius)] border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error ?? 'Failed to load summary.'}
        </div>
        <Button onClick={() => void loadData()} variant="outline">
          Retry
        </Button>
      </main>
    );
  }

  const is7d = period === 'last7';
  const periodDonated = is7d ? summary.donatedMealsLast7Days : summary.donatedMealsLast30Days;
  const periodRequested = is7d ? summary.requestedMealsLast7Days : summary.requestedMealsLast30Days;
  const periodDeliveries = is7d ? summary.volunteerDeliveriesLast7Days : summary.volunteerDeliveriesLast30Days;

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-8">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back, {profile?.fullName || session?.email}!
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadData()}>
            Refresh
          </Button>
        </div>
      </header>

      {/* Capability Setup CTAs if any is missing */}
      {(!summary.hasDonorProfile || !summary.hasReceiverProfile || !summary.hasVolunteerProfile) && (
        <section aria-label="Available Capabilities" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Get Involved
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {!summary.hasDonorProfile && (
              <CapabilitySetupCard
                title="Become a donor"
                description="Share extra food from events, restaurants, or kitchens."
                yesLabel="Set up donor"
                yesTo="/donate/onboarding"
              />
            )}
            {!summary.hasReceiverProfile && (
              <CapabilitySetupCard
                title="Want to receive food?"
                description="Request food supplies for shelters, pantries, or communities."
                yesLabel="Set up receiver"
                yesTo="/receive/onboarding"
              />
            )}
            {!summary.hasVolunteerProfile && (
              <CapabilitySetupCard
                title="Work as a volunteer"
                description="Help transport meals from donors to those in need."
                yesLabel="Join as volunteer"
                yesTo="/volunteer/onboarding"
              />
            )}
          </div>
        </section>
      )}

      {/* Active Work / In-Progress section */}
      {(summary.activeDonationsCount > 0 || summary.activeRequestsCount > 0 || summary.activeVolunteerService) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Active Records
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {summary.activeDonationsCount > 0 && (
              <div className="rounded-[var(--radius)] border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground font-medium">Active Donations</p>
                <p className="text-2xl font-bold text-primary mt-1">{summary.activeDonationsCount}</p>
                <Link to="/donate" className="text-xs text-primary hover:underline mt-2 inline-block">
                  View in Donate &rarr;
                </Link>
              </div>
            )}
            {summary.activeRequestsCount > 0 && (
              <div className="rounded-[var(--radius)] border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground font-medium">Active Food Requests</p>
                <p className="text-2xl font-bold text-primary mt-1">{summary.activeRequestsCount}</p>
                <Link to="/receive" className="text-xs text-primary hover:underline mt-2 inline-block">
                  View in Receive &rarr;
                </Link>
              </div>
            )}
            {summary.activeVolunteerService && (
              <div className="sm:col-span-3">
                <VolunteerServiceCard service={summary.activeVolunteerService} />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Today's Activity */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Today's Activity
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Donated Meals" value={summary.todayDonatedMeals} unit="meals" />
          <SummaryCard label="Requested Meals" value={summary.todayRequestedMeals} unit="meals" />
          <SummaryCard label="Deliveries Completed" value={summary.todayVolunteerDeliveries} unit="trips" />
        </div>
      </section>

      {/* Trends / Historical Activity */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Activity Overview
          </h2>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Donated Meals"
            value={periodDonated}
            unit="meals"
            caption={is7d ? 'Past 7 days' : 'Past 30 days'}
          />
          <SummaryCard
            label="Requested Meals"
            value={periodRequested}
            unit="meals"
            caption={is7d ? 'Past 7 days' : 'Past 30 days'}
          />
          <SummaryCard
            label="Deliveries Completed"
            value={periodDeliveries}
            unit="trips"
            caption={is7d ? 'Past 7 days' : 'Past 30 days'}
          />
        </div>
      </section>
    </main>
  );
}
