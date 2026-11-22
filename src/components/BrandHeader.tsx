'use client';

import { useState } from 'react';

interface BrandHeaderProps {
  className?: string;
  showName?: boolean;
}

const BRAND_NAME = 'FoodPulse';
const LOGO_SRC = '';

export default function BrandHeader({ className = '', showName = true }: BrandHeaderProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const showImage = LOGO_SRC.length > 0 && !logoFailed;

  return (
    <div
      data-nexen-component="BrandHeader"
      className={`flex min-w-0 items-center gap-2 font-sans font-bold text-lg text-foreground ${className}`}
    >
      {showImage ? (
        <img
          data-nexen-logo
          src={LOGO_SRC}
          alt={`${BRAND_NAME} logo`}
          className="h-8 w-8 shrink-0 rounded-[var(--radius)] object-contain"
          onError={() => setLogoFailed(true)}
         data-nexen-id="nx-781ee9cf-0"/>
      ) : (
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground"
         data-nexen-id="nx-781ee9cf-1">
          F
        </span>
      )}
      {showName && <span className="truncate" data-nexen-id="nx-781ee9cf-2">{BRAND_NAME}</span>}
    </div>
  );
}