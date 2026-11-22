export type VolunteerServiceCardService = {
  status: string;
  createdAt: string;
};

export interface VolunteerServiceCardProps {
  service?: VolunteerServiceCardService | null;
}

function formatStatus(status: string): string {
  const words = status.split('_').filter(Boolean);
  return words
    .map((word, index) =>
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word,
    )
    .join(' ');
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function VolunteerServiceCard(props: VolunteerServiceCardProps) {
  const service = props.service ?? null;

  return (
    <section
      data-nexen-component="VolunteerServiceCard"
      className="w-full min-w-0 rounded-[var(--radius)] border bg-card p-6 shadow-sm"
     data-nexen-id="nx-a20f3b28-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" data-nexen-id="nx-a20f3b28-1">
        Current service
      </p>

      {service ? (
        <div className="mt-3 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary" data-nexen-id="nx-a20f3b28-2">
              {formatStatus(service.status)}
            </span>
          </div>
          <p className="min-w-0 break-words text-sm text-muted-foreground" data-nexen-id="nx-a20f3b28-3">
            Created {formatCreatedAt(service.createdAt)}
          </p>
        </div>
      ) : (
        <div className="mt-3 min-w-0">
          <p className="text-base font-semibold text-foreground" data-nexen-id="nx-a20f3b28-4">
            No active delivery right now
          </p>
          <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-a20f3b28-5">
            When a delivery is assigned to you, it will appear here.
          </p>
        </div>
      )}
    </section>
  );
}

export default VolunteerServiceCard;