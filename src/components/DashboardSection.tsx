import { Children, type ReactNode } from 'react';

export interface DashboardSectionProps {
  title: string;
  emptyMessage: string;
  /** Forces the empty state. When omitted, the section is empty if it has no children. */
  isEmpty?: boolean;
  action?: ReactNode;
  children?: ReactNode;
}

export function DashboardSection(props: DashboardSectionProps) {
  const { title, emptyMessage, isEmpty, action, children } = props;

  const hasChildren = Children.toArray(children).length > 0;
  const showEmpty = isEmpty ?? !hasChildren;

  return (
    <section
      data-nexen-component="DashboardSection"
      className="min-w-0 w-full space-y-4"
     data-nexen-id="nx-2aa1c444-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="min-w-0 break-words font-sans text-lg font-semibold tracking-tight text-foreground sm:text-xl" data-nexen-id="nx-2aa1c444-1">
          {title}
        </h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="min-w-0 w-full rounded-[var(--radius)] border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-6">
        {showEmpty ? (
          <p className="text-sm text-muted-foreground" data-nexen-id="nx-2aa1c444-2">{emptyMessage}</p>
        ) : (
          <div className="grid min-w-0 gap-3">{children}</div>
        )}
      </div>
    </section>
  );
}

export default DashboardSection;