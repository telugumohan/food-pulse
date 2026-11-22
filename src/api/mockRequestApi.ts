import type { FoodRequest, MockApiResponse, ReceiverProfile } from './types';
import { delay, fail, ok } from './mockDelay';
import { getStorageValue, setStorageValue } from './mockStorage';
import {
  validateAddress,
  validateCity,
  validateDeadline,
  validateLatitude,
  validateLongitude,
  validatePureVegMeals,
  validateTotalMeals,
} from './validation';

const FOOD_REQUESTS_KEY = 'foodpulse_mock_food_requests';
const RECEIVER_PROFILES_KEY = 'foodpulse_mock_receiver_profiles';

export interface CreateFoodRequestInput {
  receiverId: string;
  initialTotalMeals: number;
  initialPureVegMeals: number;
  neededBeforeAt: string;
  receivingAddress: string;
  receivingCity: string;
  receivingLatitude: number;
  receivingLongitude: number;
}

function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readFoodRequests(): FoodRequest[] {
  return getStorageValue<FoodRequest[]>(FOOD_REQUESTS_KEY, []);
}

function newestFirst<T extends { createdAt: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

function firstError(checks: Array<[string | null, string]>): MockApiResponse<never> | null {
  for (const [message, field] of checks) {
    if (message) {
      return fail('VALIDATION_ERROR', message, field);
    }
  }
  return null;
}

export async function listFoodRequests(userId: string): Promise<MockApiResponse<FoodRequest[]>> {
  await delay();
  const owned = readFoodRequests().filter((request) => request.receiverId === userId);
  return ok(newestFirst(owned));
}

export async function getFoodRequest(
  userId: string,
  requestId: string,
): Promise<MockApiResponse<FoodRequest>> {
  await delay();
  const request = readFoodRequests().find(
    (item) => item.id === requestId && item.receiverId === userId,
  );
  if (!request) {
    return fail('NOT_FOUND', 'Food request not found.');
  }
  return ok(request);
}

export async function createFoodRequest(
  input: CreateFoodRequestInput,
): Promise<MockApiResponse<FoodRequest>> {
  await delay();

  const receiverProfiles = getStorageValue<Record<string, ReceiverProfile>>(RECEIVER_PROFILES_KEY, {});
  if (!Object.prototype.hasOwnProperty.call(receiverProfiles, input.receiverId)) {
    return fail('NOT_FOUND', 'Create a receiver profile first.');
  }

  const now = new Date();
  const receivingAddress = (input.receivingAddress ?? '').trim();
  const receivingCity = (input.receivingCity ?? '').trim();

  const failure = firstError([
    [validateTotalMeals(input.initialTotalMeals, 'Total meals'), 'initialTotalMeals'],
    [validatePureVegMeals(input.initialPureVegMeals, input.initialTotalMeals), 'initialPureVegMeals'],
    [validateDeadline(input.neededBeforeAt, now), 'neededBeforeAt'],
    [validateAddress(receivingAddress), 'receivingAddress'],
    [validateCity(receivingCity), 'receivingCity'],
    [validateLatitude(input.receivingLatitude), 'receivingLatitude'],
    [validateLongitude(input.receivingLongitude), 'receivingLongitude'],
  ]);
  if (failure) {
    return failure;
  }

  const timestamp = now.toISOString();
  const request: FoodRequest = {
    id: createId(),
    receiverId: input.receiverId,
    initialTotalMeals: input.initialTotalMeals,
    remainingTotalMeals: input.initialTotalMeals,
    initialPureVegMeals: input.initialPureVegMeals,
    remainingPureVegMeals: input.initialPureVegMeals,
    neededBeforeAt: new Date(input.neededBeforeAt.trim()).toISOString(),
    receivingAddress,
    receivingCity,
    receivingLatitude: input.receivingLatitude,
    receivingLongitude: input.receivingLongitude,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  setStorageValue(FOOD_REQUESTS_KEY, [...readFoodRequests(), request]);
  return ok(request);
}
