import type { MockApiError, MockApiResponse } from './types';

export function delay(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 300);
  });
}

export function ok<T>(data: T): MockApiResponse<T> {
  return { data, error: null };
}

export function fail<T = never>(
  code: MockApiError['code'],
  message: string,
  field?: string,
): MockApiResponse<T> {
  const error: MockApiError = field === undefined ? { code, message } : { code, message, field };
  return { data: null, error };
}
