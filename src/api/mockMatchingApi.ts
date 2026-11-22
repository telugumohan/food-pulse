import { delay, fail, ok } from './mockDelay';
import { getStorageValue, setStorageValue } from './mockStorage';
import { getVolunteerService } from './mockVolunteerApi';
import type { DeliveryService, MockApiResponse } from './types';

const DELIVERY_SERVICES_KEY = 'foodpulse_mock_delivery_services';

function findAssignedService(
  services: DeliveryService[],
  userId: string,
  serviceId: string,
): DeliveryService | undefined {
  return services.find(
    (service) =>
      service.id === serviceId && service.volunteerId === userId && service.status === 'assigned',
  );
}

export async function getActiveMatches(userId: string): Promise<MockApiResponse<unknown[]>> {
  await delay();
  void userId;
  return ok([]);
}

export async function acceptMockAssignment(
  userId: string,
  serviceId: string,
): Promise<MockApiResponse<DeliveryService>> {
  await delay();

  const services = getStorageValue<DeliveryService[]>(DELIVERY_SERVICES_KEY, []);
  const record = findAssignedService(services, userId, serviceId);
  if (!record) {
    return fail('NOT_FOUND', 'Assignment not found.');
  }

  const updated: DeliveryService = { ...record, status: 'accepted' };
  setStorageValue<DeliveryService[]>(
    DELIVERY_SERVICES_KEY,
    services.map((service) => (service === record ? updated : service)),
  );
  return ok(updated);
}

export async function declineMockAssignment(
  userId: string,
  serviceId: string,
): Promise<MockApiResponse<DeliveryService>> {
  await delay();

  const services = getStorageValue<DeliveryService[]>(DELIVERY_SERVICES_KEY, []);
  const record = findAssignedService(services, userId, serviceId);
  if (!record) {
    return fail('NOT_FOUND', 'Assignment not found.');
  }

  const updated: DeliveryService = {
    ...record,
    status: 'declined',
    endedAt: new Date().toISOString(),
  };
  setStorageValue<DeliveryService[]>(
    DELIVERY_SERVICES_KEY,
    services.map((service) => (service === record ? updated : service)),
  );
  return ok(updated);
}

export async function getMockVolunteerService(
  userId: string,
): Promise<MockApiResponse<DeliveryService | null>> {
  await delay();
  return getVolunteerService(userId);
}
