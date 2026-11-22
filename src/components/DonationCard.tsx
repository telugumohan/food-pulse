import { useEffect, useState } from 'react';
import type { Donation, MatchAllocation } from '@/api/types';
import { getDonationAllocations } from '@/api/supabaseApi';

type Props = {
  donation: Donation;
};

type DonationStatus = 'active' | 'expired' | 'completed';

const STATUS_LABEL: Record<DonationStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  completed: 'Completed',
};

const STATUS_CLASS: Record<DonationStatus, string> = {
  active: 'bg-primary/10 text-primary',
  expired: 'bg-destructive/10 text-destructive',
  completed: 'bg-secondary text-secondary-foreground',
};

const UNKNOWN_ALLERGENS = 'Unknown / not provided';

function toTime(value: string | Date | null | undefined): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function formatDateTime(value: string | Date | null | undefined): string {
  const time = toTime(value);
  if (Number.isNaN(time)) return '—';
  return new Date(time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function getDonationStatus(donation: Donation): DonationStatus {
  const remaining =
    Number(donation.remainingVegMeals ?? 0) + Number(donation.remainingNonVegMeals ?? 0);
  if (remaining <= 0) return 'completed';

  const now = Date.now();
  const bestBefore = toTime(donation.bestBeforeAt);
  const availableUntil = toTime(donation.availableUntilAt);
  if (Number.isNaN(bestBefore) || Number.isNaN(availableUntil)) return 'expired';
  if (bestBefore <= now || availableUntil <= now) return 'expired';
  return 'active';
}

const DELIVERY_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  assigned: { label: '🚚 Volunteer Assigned', cls: 'bg-blue-100 text-blue-800' },
  accepted: { label: '✅ Volunteer Accepted', cls: 'bg-blue-100 text-blue-800' },
  active: { label: '🔄 Active Delivery', cls: 'bg-yellow-100 text-yellow-800' },
  picked_up: { label: '📦 Food Picked Up', cls: 'bg-yellow-100 text-yellow-800' },
  in_transit: { label: '🚗 In Transit', cls: 'bg-orange-100 text-orange-800' },
  delivered: { label: '🎉 Delivered!', cls: 'bg-green-100 text-green-800' },
  declined: { label: '⚠️ Volunteer Declined', cls: 'bg-red-100 text-red-700' },
  cancelled: { label: '✖ Cancelled', cls: 'bg-gray-100 text-gray-600' },
};

export function DonationCard({ donation }: Props) {
  const status = getDonationStatus(donation);
  const allergenText = donation.allergensUnknown
    ? UNKNOWN_ALLERGENS
    : donation.allergenInformation?.trim() || UNKNOWN_ALLERGENS;

  const initialTotal = donation.initialVegMeals + donation.initialNonVegMeals;
  const remainingTotal = donation.remainingVegMeals + donation.remainingNonVegMeals;
  const matchedTotal = initialTotal - remainingTotal;

  const [allocations, setAllocations] = useState<MatchAllocation[]>([]);

  useEffect(() => {
    getDonationAllocations(donation.id).then((res) => {
      if (res.data) setAllocations(res.data);
    });
  }, [donation.id]);

  const hasVolunteer = allocations.some((a) => a.volunteerId || a.deliveryStatus);
  const latestDeliveryStatus = allocations
    .map((a) => a.deliveryStatus)
    .filter(Boolean)
    .at(-1);

  return (
    <article
      data-nexen-component="DonationCard"
      className="min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <h3 className="min-w-0 break-words text-base font-semibold tracking-tight">
          {donation.foodDescription}
        </h3>
        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
        >
          {STATUS_LABEL[status]}
        </span>
      </header>

      {/* Match Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-muted-foreground uppercase tracking-wide">
            Matching Progress
          </span>
          <span className="font-bold text-foreground">
            {matchedTotal}/{initialTotal} meals matched
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: initialTotal > 0 ? `${Math.min(100, (matchedTotal / initialTotal) * 100)}%` : '0%' }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {matchedTotal > 0 && (
            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              🤝 {matchedTotal} meals matched
            </span>
          )}
          {hasVolunteer && (
            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              🚚 Volunteer Assigned
            </span>
          )}
          {latestDeliveryStatus && DELIVERY_STATUS_LABEL[latestDeliveryStatus] && (
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${DELIVERY_STATUS_LABEL[latestDeliveryStatus].cls}`}
            >
              {DELIVERY_STATUS_LABEL[latestDeliveryStatus].label}
            </span>
          )}
          {allocations.length === 0 && matchedTotal === 0 && status === 'active' && (
            <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              ⏳ Awaiting Match
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Vegetarian meals
          </dt>
          <dd className="break-words">
            {donation.remainingVegMeals} remaining of {donation.initialVegMeals}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Non-vegetarian meals
          </dt>
          <dd className="break-words">
            {donation.remainingNonVegMeals} remaining of {donation.initialNonVegMeals}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Best before
          </dt>
          <dd className="break-words">{formatDateTime(donation.bestBeforeAt)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Available until
          </dt>
          <dd className="break-words">{formatDateTime(donation.availableUntilAt)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pickup city
          </dt>
          <dd className="break-words">{donation.pickupCity}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Allergens
          </dt>
          <dd className="break-words">{allergenText}</dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Handling
          </dt>
          <dd className="break-words">{donation.storageHandlingInformation}</dd>
        </div>
      </dl>
    </article>
  );
}

export default DonationCard;
