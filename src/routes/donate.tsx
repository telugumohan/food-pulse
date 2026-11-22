import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import { getDonorProfile, listDonations } from '@/api/supabaseApi';
import type { Donation, DonorProfile } from '@/api/types';
import DonationCard from '@/components/DonationCard';
import CapabilitySetupCard from '@/components/CapabilitySetupCard';
import { Button } from '@/components/ui/button';

export default function DonatePage() {
  const { session } = useSession();
  const [profile, setProfile] = useState<DonorProfile | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!session?.userId) return;
    setLoading(true);
    setError(null);
    try {
      const pRes = await getDonorProfile(session.userId);
      if (pRes.error) {
        setError(pRes.error.message);
        setLoading(false);
        return;
      }
      setProfile(pRes.data);

      if (pRes.data) {
        const dRes = await listDonations(session.userId);
        if (dRes.error) {
          setError(dRes.error.message);
        } else {
          setDonations(dRes.data ?? []);
        }
      }
    } catch {
      setError('Could not load donor information.');
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
        <p className="text-sm text-muted-foreground">Loading donor profile…</p>
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

  // Not a donor yet -> show first-use card per PRD §7.1
  if (!profile) {
    return (
      <main className="mx-auto w-full max-w-2xl p-4 sm:p-6 text-foreground space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Donate Food</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connect surplus meals with local shelters and kitchens.
          </p>
        </div>
        <CapabilitySetupCard
          title="Want to become a donor?"
          description="Register your restaurant, hostel mess, canteen, caterer, or event kitchen to post surplus meals."
          yesLabel="Yes, become a donor"
          yesTo="/donate/onboarding"
          notNowLabel="Not now"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl p-4 sm:p-6 text-foreground space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Donations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organization: <span className="font-semibold text-foreground">{profile.organizationName}</span> ({profile.city})
          </p>
        </div>
        <Button asChild>
          <Link to="/donate/create">+ Post New Donation</Link>
        </Button>
      </div>

      {donations.length === 0 ? (
        <div className="rounded-[var(--radius)] border border-border bg-card p-8 text-center space-y-3">
          <p className="text-base font-semibold">No donations created yet</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            When you have surplus vegetarian or non-vegetarian meals ready for pickup, create a listing here.
          </p>
          <Button asChild variant="outline">
            <Link to="/donate/create">Create your first donation</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {donations.map((d) => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}
    </main>
  );
}
