'use client';

import { useState } from 'react';

export type PeriodValue = 'last7' | 'last30';

interface PeriodSelectorProps {
  value?: PeriodValue;
  onChange?: (value: PeriodValue) => void;
}

const OPTIONS: { value: PeriodValue; label: string }[] = [
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
];

export default function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const [internalValue, setInternalValue] = useState<PeriodValue>('last7');
  const current = value ?? internalValue;

  const handleSelect = (next: PeriodValue) => {
    if (value === undefined) {
      setInternalValue(next);
    }
    onChange?.(next);
  };

  return (
    <div
      data-nexen-component="PeriodSelector"
      role="group"
      aria-label="Select period"
      className="inline-flex w-full max-w-full flex-wrap gap-1 rounded-[var(--radius)] border border-border bg-card p-1 shadow-sm sm:w-auto"
    >
      {OPTIONS.map((option) => {
        const isActive = current === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(option.value)}
            className={[
              'min-w-0 flex-1 rounded-[var(--radius)] px-3 py-2 text-sm font-semibold transition-colors sm:flex-none',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
           data-nexen-id="nx-14fe19f9-0">
            {option.label}
          </button>
        );
      })}
    </div>
  );
}