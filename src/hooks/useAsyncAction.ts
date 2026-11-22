'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAsyncActionOptions<TResult> {
  /** Called with the resolved value after the action succeeds. */
  onSuccess?: (result: TResult) => void;
  /** Message shown when the error has no usable text. */
  fallbackError?: string;
}

export interface UseAsyncActionResult<TArgs extends unknown[], TResult> {
  /** Runs the action. Resolves to the result, or undefined when it failed or was already in flight. */
  execute: (...args: TArgs) => Promise<TResult | undefined>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

const DEFAULT_FALLBACK_ERROR = 'Something went wrong. Please try again.';
const MAX_ERROR_LENGTH = 160;

function toConciseMessage(err: unknown, fallback: string): string {
  let message = '';
  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  }

  message = message.replace(/\s+/g, ' ').trim();
  if (!message) return fallback;

  if (message.length > MAX_ERROR_LENGTH) {
    return `${message.slice(0, MAX_ERROR_LENGTH - 1).trimEnd()}…`;
  }
  return message;
}

export function useAsyncAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  options: UseAsyncActionOptions<TResult> = {},
): UseAsyncActionResult<TArgs, TResult> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);
  const actionRef = useRef(action);
  const onSuccessRef = useRef(options.onSuccess);
  const fallbackRef = useRef(options.fallbackError ?? DEFAULT_FALLBACK_ERROR);

  actionRef.current = action;
  onSuccessRef.current = options.onSuccess;
  fallbackRef.current = options.fallbackError ?? DEFAULT_FALLBACK_ERROR;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (...args: TArgs): Promise<TResult | undefined> => {
    if (inFlightRef.current) return undefined;

    inFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionRef.current(...args);
      if (mountedRef.current) {
        onSuccessRef.current?.(result);
      }
      return result;
    } catch (err) {
      if (mountedRef.current) {
        setError(toConciseMessage(err, fallbackRef.current));
      }
      return undefined;
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, isLoading, error, clearError };
}

export default useAsyncAction;