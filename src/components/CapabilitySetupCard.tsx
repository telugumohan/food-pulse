'use client';

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export interface CapabilitySetupCardProps {
  title?: string;
  description?: string;
  yesLabel?: string;
  yesTo: string;
  notNowLabel?: string;
  onNotNow?: () => void;
}

export function CapabilitySetupCard(props: CapabilitySetupCardProps) {
  const {
    title = 'Want to get involved?',
    description = 'Set up this capability on your FoodPulse account to start using it.',
    yesLabel = 'Yes',
    yesTo,
    notNowLabel = 'Not now',
    onNotNow,
  } = props;

  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const handleNotNow = () => {
    onNotNow?.();
    setDismissed(true);
  };

  return (
    <section
      data-nexen-component="CapabilitySetupCard"
      className="w-full max-w-full min-w-0 rounded-[var(--radius)] border border-border bg-card p-4 shadow-sm sm:p-6"
     data-nexen-id="nx-e490920d-0">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold tracking-tight text-foreground" data-nexen-id="nx-e490920d-1">
            {title}
          </h3>
          <p className="mt-1 break-words text-sm text-muted-foreground" data-nexen-id="nx-e490920d-2">{description}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild className="w-full sm:w-auto" data-nexen-id="nx-e490920d-3">
            <Link to={yesTo} data-nexen-id="nx-e490920d-4">{yesLabel}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleNotNow}
           data-nexen-id="nx-e490920d-5">
            {notNowLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default CapabilitySetupCard;