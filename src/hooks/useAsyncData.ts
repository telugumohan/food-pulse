'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { DependencyList } from 'react';

export interface UseAsyncDataResult<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  return new Error('Something went wrong while loading data.');
}

export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  deps: DependencyList = [],
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setData(result);
    } catch (err: unknown) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setError(toError(err));
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    // deps are supplied by the caller and control when the data reloads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, ...deps]);

  const refetch = useCallback(() => load(), [load]);

  return { data, isLoading, error, refetch };
}

export default useAsyncData;