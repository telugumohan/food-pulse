'use client';

import { useId } from 'react';
import type { ChangeEvent } from 'react';

export type FormFieldOption = { value: string; label: string };
export type FormFieldControl = 'input' | 'textarea' | 'select';

export interface FormFieldProps {
  label: string;
  id?: string;
  name?: string;
  control?: FormFieldControl;
  type?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  rows?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  options?: FormFieldOption[];
  hint?: string;
  error?: string | null;
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur?: () => void;
}

const baseControl =
  'w-full min-w-0 rounded-[var(--radius)] border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60';

export function FormField({
  label,
  id,
  name,
  control = 'input',
  type = 'text',
  value,
  defaultValue,
  placeholder,
  autoComplete,
  required = false,
  disabled = false,
  rows = 4,
  min,
  max,
  step,
  options = [],
  hint,
  error,
  onChange,
  onBlur,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? `field-${generatedId}`;
  const errorId = `${fieldId}-error`;
  const hintId = `${fieldId}-hint`;
  const hasError = Boolean(error);
  const describedBy = hasError ? errorId : hint ? hintId : undefined;

  const stateClass = hasError
    ? 'border-destructive focus:ring-destructive/40'
    : 'border-border focus:ring-ring';
  const className = `${baseControl} ${stateClass}`;

  const controlValue = value === undefined ? undefined : String(value);
  const controlDefault = defaultValue === undefined ? undefined : String(defaultValue);

  const sharedProps = {
    id: fieldId,
    name,
    disabled,
    required,
    onChange,
    onBlur,
    className,
    'aria-invalid': hasError || undefined,
    'aria-describedby': describedBy,
  };

  let controlEl;
  if (control === 'textarea') {
    controlEl = (
      <textarea
        {...sharedProps}
        rows={rows}
        placeholder={placeholder}
        value={controlValue}
        defaultValue={controlValue === undefined ? controlDefault : undefined}
       data-nexen-id="nx-7126768e-0"/>
    );
  } else if (control === 'select') {
    controlEl = (
      <select
        {...sharedProps}
        value={controlValue}
        defaultValue={controlValue === undefined ? controlDefault : undefined}
       data-nexen-id="nx-7126768e-1">
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  } else {
    controlEl = (
      <input
        {...sharedProps}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        max={max}
        step={step}
        value={controlValue}
        defaultValue={controlValue === undefined ? controlDefault : undefined}
       data-nexen-id="nx-7126768e-2"/>
    );
  }

  return (
    <div data-nexen-component="FormField" className="grid min-w-0 gap-1.5">
      <label htmlFor={fieldId} className="text-[0.8125rem] font-semibold text-foreground" data-nexen-id="nx-7126768e-3">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-destructive" data-nexen-id="nx-7126768e-4">
            {' *'}
          </span>
        ) : null}
      </label>
      {controlEl}
      {hasError ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-destructive" data-nexen-id="nx-7126768e-5">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground" data-nexen-id="nx-7126768e-6">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export default FormField;