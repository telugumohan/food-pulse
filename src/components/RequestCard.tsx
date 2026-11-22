export interface RequestCardData {
  id: string;
  initialTotalMeals: number;
  remainingTotalMeals: number;
  initialPureVegMeals: number;
  remainingPureVegMeals: number;
  neededBeforeAt: string;
  receivingCity: string;
}

interface RequestCardProps {
  request: RequestCardData;
}

type RequestStatus = 'active' | 'expired' | 'fulfilled';

function getRequestStatus(request: RequestCardData): RequestStatus {
  if (request.remainingTotalMeals <= 0) return 'fulfilled';
  const neededBefore = new Date(request.neededBeforeAt).getTime();
  if (Number.isNaN(neededBefore) || neededBefore <= Date.now()) return 'expired';
  return 'active';
}

const STATUS_LABEL: Record<RequestStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  fulfilled: 'Fulfilled',
};

const STATUS_CLASS: Record<RequestStatus, string> = {
  active: 'bg-primary/10 text-primary',
  expired: 'bg-destructive/10 text-destructive',
  fulfilled: 'bg-secondary text-secondary-foreground',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius)] border border-border bg-background p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" data-nexen-id="nx-84d86bc9-0">{label}</p>
      <p className="mt-1 text-xl font-bold text-foreground" data-nexen-id="nx-84d86bc9-1">{value}</p>
      <p className="text-xs text-muted-foreground" data-nexen-id="nx-84d86bc9-2">{detail}</p>
    </div>
  );
}

export default function RequestCard({ request }: RequestCardProps) {
  const req = request ?? null;
  if (!req) return null;

  const status = getRequestStatus(req);
  const flexibleRemaining = Math.max(
    req.remainingTotalMeals - req.remainingPureVegMeals,
    0,
  );

  return (
    <div
      data-nexen-component="RequestCard"
      className="w-full min-w-0 max-w-full rounded-[var(--radius)] border border-border bg-card p-5 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" data-nexen-id="nx-84d86bc9-3">
            Needed before
          </p>
          <p className="mt-1 break-words text-base font-semibold text-foreground" data-nexen-id="nx-84d86bc9-4">
            {formatDate(req.neededBeforeAt)}
          </p>
          <p className="mt-1 break-words text-sm text-muted-foreground" data-nexen-id="nx-84d86bc9-5">
            City: {req.receivingCity}
          </p>
        </div>
        <span
          className={`inline-flex w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLASS[status]}`}
         data-nexen-id="nx-84d86bc9-6">
          {STATUS_LABEL[status]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Total meals"
          value={req.remainingTotalMeals}
          detail={`of ${req.initialTotalMeals} requested`}
        />
        <Stat
          label="Pure vegetarian"
          value={req.remainingPureVegMeals}
          detail={`of ${req.initialPureVegMeals} requested`}
        />
        <Stat
          label="Flexible remaining"
          value={flexibleRemaining}
          detail="Any meal type"
        />
      </div>
    </div>
  );
}