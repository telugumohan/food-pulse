'use client';

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

const actionClass =
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2';

const DefaultIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  const hasAction = Boolean(actionLabel) && (Boolean(actionHref) || Boolean(onAction));

  return (
    <div
      data-nexen-component="EmptyState"
      className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-card p-6 text-center shadow-sm sm:p-8"
    >
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--radius)] bg-primary/10 text-primary">
        {icon ?? <DefaultIcon />}
      </div>

      <h3 className="break-words text-lg font-semibold text-foreground" data-nexen-id="nx-d69f50f7-0">{title}</h3>

      {description ? (
        <p className="mx-auto mt-2 max-w-md break-words text-sm text-muted-foreground" data-nexen-id="nx-d69f50f7-1">
          {description}
        </p>
      ) : null}

      {hasAction ? (
        <div className="mt-5 flex justify-center">
          {actionHref ? (
            <Link to={actionHref} className={`${actionClass} w-full sm:w-auto`} data-nexen-id="nx-d69f50f7-2">
              {actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className={`${actionClass} w-full sm:w-auto`}
             data-nexen-id="nx-d69f50f7-3">
              {actionLabel}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default EmptyState;