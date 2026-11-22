type SummaryCardProps = {
  label: string;
  value?: number | null;
  unit?: string;
  caption?: string;
};

export function SummaryCard(props: SummaryCardProps) {
  const label = typeof props.label === 'string' ? props.label : '';
  const unit = typeof props.unit === 'string' ? props.unit : '';
  const caption = typeof props.caption === 'string' ? props.caption : '';
  const hasValue = typeof props.value === 'number' && Number.isFinite(props.value);
  const displayValue = hasValue ? (props.value as number).toLocaleString() : '0';

  return (
    <div
      data-nexen-component="SummaryCard"
      className="min-w-0 w-full rounded-[var(--radius)] border bg-card p-6 text-card-foreground shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground break-words" data-nexen-id="nx-28c1a895-0">
        {label}
      </p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl" data-nexen-id="nx-28c1a895-1">
          {displayValue}
        </span>
        {unit ? (
          <span className="min-w-0 break-words text-sm font-medium text-muted-foreground" data-nexen-id="nx-28c1a895-2">
            {unit}
          </span>
        ) : null}
      </div>
      {caption ? (
        <p className="mt-1.5 min-w-0 break-words text-sm text-muted-foreground" data-nexen-id="nx-28c1a895-3">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

export default SummaryCard;