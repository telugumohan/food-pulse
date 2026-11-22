'use client';

import type { ReactNode } from 'react';

type RequestErrorAlertTone = 'error' | 'success';

interface RequestErrorAlertProps {
  message?: string | null;
  tone?: RequestErrorAlertTone;
  title?: string;
  retryLabel?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  children?: ReactNode;
}

const toneClasses: Record<RequestErrorAlertTone, string> = {
  error: 'border-destructive/40 bg-destructive/10 text-destructive',
  success: 'border-primary/40 bg-primary/10 text-primary',
};

const defaultTitles: Record<RequestErrorAlertTone, string> = {
  error: 'Something went wrong',
  success: 'Done',
};

export function RequestErrorAlert(props: RequestErrorAlertProps) {
  const tone: RequestErrorAlertTone = props.tone === 'success' ? 'success' : 'error';
  const message = typeof props.message === 'string' ? props.message.trim() : '';
  const title = props.title ?? defaultTitles[tone];
  const retryLabel = props.retryLabel ?? 'Try again';
  const hasRetry = typeof props.onRetry === 'function';
  const hasDismiss = typeof props.onDismiss === 'function';

  if (!message && !props.children) {
    return null;
  }

  return (
    <div
      data-nexen-component="RequestErrorAlert"
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={`flex w-full min-w-0 flex-col gap-3 rounded-[var(--radius)] border p-4 text-sm sm:flex-row sm:items-start sm:justify-between ${toneClasses[tone]}`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-5" data-nexen-id="nx-9fc281b8-0">{title}</p>
        {message ? (
          <p className="mt-1 break-words text-foreground/80" data-nexen-id="nx-9fc281b8-1">{message}</p>
        ) : null}
        {props.children ? <div className="mt-1">{props.children}</div> : null}
      </div>

      {hasRetry || hasDismiss ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          {hasRetry ? (
            <button
              type="button"
              onClick={props.onRetry}
              className="inline-flex items-center justify-center rounded-[var(--radius)] border border-current px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
             data-nexen-id="nx-9fc281b8-2">
              {retryLabel}
            </button>
          ) : null}
          {hasDismiss ? (
            <button
              type="button"
              onClick={props.onDismiss}
              aria-label="Dismiss message"
              className="inline-flex items-center justify-center rounded-[var(--radius)] px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
             data-nexen-id="nx-9fc281b8-3">
              Dismiss
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default RequestErrorAlert;