import { delay, fail, ok } from './mockDelay';
import { getStorageValue, setStorageValue } from './mockStorage';
import type { DeliveryService, MockApiResponse, VolunteerProfile } from './types';

export { getVolunteerProfile } from './mockProfileApi';

const VOLUNTEER_PROFILES_KEY = 'foodpulse_mock_volunteer_profiles';
const DELIVERY_SERVICES_KEY = 'foodpulse_mock_delivery_services';

const CLOSED_SERVICE_STATUSES: ReadonlyArray<DeliveryService['status']> = [
  'delivered',
  'declined',
  'cancelled',
  'failed',
];

type VolunteerProfileMap = Record<string, VolunteerProfile>;

export async function setVolunteerAvailability(
  userId: string,
  available: boolean,
): Promise<MockApiResponse<VolunteerProfile>> {
  await delay();

  if (typeof available !== 'boolean') {
    return fail('VALIDATION_ERROR', 'Availability must be true or false.', 'available');
  }

  const profiles = getStorageValue<VolunteerProfileMap>(VOLUNTEER_PROFILES_KEY, {});
  const existing = profiles[userId];
  if (!existing) {
    return fail('NOT_FOUND', 'Create a volunteer profile first.');
  }

  const updated: VolunteerProfile = {
    ...existing,
    available,
    updatedAt: new Date().toISOString(),
  };

  setStorageValue<VolunteerProfileMap>(VOLUNTEER_PROFILES_KEY, { ...profiles, [userId]: updated });
  return ok(updated);
}

export async function getVolunteerService(
  userId: string,
): Promise<MockApiResponse<DeliveryService | null>> {
  await delay();

  const services = getStorageValue<DeliveryService[]>(DELIVERY_SERVICES_KEY, []);
  const active = services.find(
    (service) =>
      service.volunteerId === userId && !CLOSED_SERVICE_STATUSES.includes(service.status),
  );
  return ok(active ?? null);
}
