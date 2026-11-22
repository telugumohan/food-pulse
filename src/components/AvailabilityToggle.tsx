'use client';

import { useEffect, useState } from 'react';

interface AvailabilityToggleProps {
  checked?: boolean;
  onChange?: (nextValue: boolean) => void | Promise<void>;
  disabled?: boolean;
  label?: string;
  description?: string;
}

export default function AvailabilityToggle(props: AvailabilityToggleProps) {
  const {
    checked = false,
    onChange,
    disabled = false,
    label = 'Available for deliveries',
    description,
  } = props;

  const [value, setValue] = useState<boolean>(checked);
  const [isPending, setIsPending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setValue(checked);
  }, [checked]);

  async function handleToggle() {
    if (disabled || isPending) return;

    const previousValue = value;
    const nextValue = !previousValue;

    setValue(nextValue);
    setErrorMessage(null);
    setIsPending(true);

    try {
      await onChange?.(nextValue);
    } catch (err) {
      setValue(previousValue);
      setErrorMessage(err instanceof Error ? err.message : 'Could not save availability');
    } finally {
      setIsPending(false);
    }
  }

  const trackClass = [
    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-border',
    'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:cursor-not-allowed disabled:opacity-60',
    value ? 'bg-primary' : 'bg-muted',
  ].join(' ');

  const thumbClass = [
    'inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform',
    value ? 'translate-x-5' : 'translate-x-0.5',
  ].join(' ');

  return (
    <div
      data-nexen-component="AvailabilityToggle"
      className="flex w-full max-w-md min-w-0 flex-wrap items-center justify-between gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground" data-nexen-id="nx-db8817c6-0">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground" data-nexen-id="nx-db8817c6-1">{description}</p>
        )}
        {errorMessage && (
          <p role="alert" className="mt-1 text-xs text-destructive" data-nexen-id="nx-db8817c6-2">
            {errorMessage}
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isPending && (
          <span aria-live="polite" className="text-xs text-muted-foreground" data-nexen-id="nx-db8817c6-3">
            Saving…
          </span>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={value}
          aria-label={label}
          aria-busy={isPending}
          disabled={disabled || isPending}
          onClick={handleToggle}
          className={trackClass}
         data-nexen-id="nx-db8817c6-4">
          <span className={thumbClass}  data-nexen-id="nx-db8817c6-5"/>
        </button>
      </div>
    </div>
  );
}