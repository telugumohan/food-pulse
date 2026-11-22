const MOCK_STORAGE_KEYS = [
  'foodpulse_mock_users',
  'foodpulse_mock_session',
  'foodpulse_mock_profiles',
  'foodpulse_mock_donor_profiles',
  'foodpulse_mock_receiver_profiles',
  'foodpulse_mock_volunteer_profiles',
  'foodpulse_mock_donations',
  'foodpulse_mock_food_requests',
  'foodpulse_mock_delivery_services',
  'foodpulse_mock_password_tokens',
  'foodpulse_mock_email_confirmation_tokens',
  'foodpulse_mock_seed_version',
] as const;

function getLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getStorageValue<T>(key: string, fallback: T): T {
  const storage = getLocalStorage();
  if (!storage) {
    return fallback;
  }
  try {
    const raw = storage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    removeStorageValue(key);
    return fallback;
  }
}

export function setStorageValue<T>(key: string, value: T): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the write is dropped silently.
  }
}

export function removeStorageValue(key: string): void {
  const storage = getLocalStorage();
  if (!storage) {
    return;
  }
  try {
    storage.removeItem(key);
  } catch {
    // Storage unavailable: nothing to remove.
  }
}

export function clearFoodPulseMockData(): void {
  for (const key of MOCK_STORAGE_KEYS) {
    removeStorageValue(key);
  }
}
