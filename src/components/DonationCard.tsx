import type { Donation } from '@/types/donation';

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

export function DonationCard({ donation }: Props) {
  const status = getDonationStatus(donation);
  const allergenText = donation.allergensUnknown
    ? UNKNOWN_ALLERGENS
    : donation.allergenInformation?.trim() || UNKNOWN_ALLERGENS;

  return (
    <article
      data-nexen-component="DonationCard"
      className="min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6"
     data-nexen-id="nx-968e0308-0">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4" data-nexen-id="nx-968e0308-1">
        <h3 className="min-w-0 break-words text-base font-semibold tracking-tight" data-nexen-id="nx-968e0308-2">
          {donation.foodDescription}
        </h3>
        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
         data-nexen-id="nx-968e0308-3">
          {STATUS_LABEL[status]}
        </span>
      </header>

      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2" data-nexen-id="nx-968e0308-4">
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-5">
            Vegetarian meals
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-6">
            {donation.remainingVegMeals} remaining of {donation.initialVegMeals}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-7">
            Non-vegetarian meals
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-8">
            {donation.remainingNonVegMeals} remaining of {donation.initialNonVegMeals}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-9">
            Best before
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-10">{formatDateTime(donation.bestBeforeAt)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-11">
            Available until
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-12">{formatDateTime(donation.availableUntilAt)}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-13">
            Pickup city
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-14">{donation.pickupCity}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-15">
            Allergens
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-16">{allergenText}</dd>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-nexen-id="nx-968e0308-17">
            Handling
          </dt>
          <dd className="break-words" data-nexen-id="nx-968e0308-18">{donation.storageHandlingInformation}</dd>
        </div>
      </dl>
    </article>
  );
}

export default DonationCard;