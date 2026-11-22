import type { Donation, DonorProfile, MockApiResponse } from './types';
import { delay, fail, ok } from './mockDelay';
import { getStorageValue, setStorageValue } from './mockStorage';
import {
  validateAddress,
  validateAllergenInformation,
  validateCity,
  validateDeadline,
  validateFoodDescription,
  validateHandlingInformation,
  validateLatitude,
  validateLongitude,
  validateMealQuantity,
} from './validation';

const DONATIONS_KEY = 'foodpulse_mock_donations';
const DONOR_PROFILES_KEY = 'foodpulse_mock_donor_profiles';

export interface CreateDonationInput {
  donorId: string;
  foodDescription: string;
  initialVegMeals: number;
  initialNonVegMeals: number;
  bestBeforeAt: string;
  availableUntilAt: string;
  pickupAddress: string;
  pickupCity: string;
  pickupLatitude: number;
  pickupLongitude: number;
  storageHandlingInformation: string;
  allergenInformation: string | null;
  allergensUnknown: boolean;
}

function createId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readDonations(): Donation[] {
  return getStorageValue<Donation[]>(DONATIONS_KEY, []);
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

export async function listDonations(userId: string): Promise<MockApiResponse<Donation[]>> {
  await delay();
  const owned = readDonations().filter((donation) => donation.donorId === userId);
  return ok(newestFirst(owned));
}

export async function getDonation(userId: string, donationId: string): Promise<MockApiResponse<Donation>> {
  await delay();
  const donation = readDonations().find(
    (item) => item.id === donationId && item.donorId === userId,
  );
  if (!donation) {
    return fail('NOT_FOUND', 'Donation not found.');
  }
  return ok(donation);
}

export async function createDonation(input: CreateDonationInput): Promise<MockApiResponse<Donation>> {
  await delay();

  const donorProfiles = getStorageValue<Record<string, DonorProfile>>(DONOR_PROFILES_KEY, {});
  if (!Object.prototype.hasOwnProperty.call(donorProfiles, input.donorId)) {
    return fail('NOT_FOUND', 'Create a donor profile first.');
  }

  const now = new Date();
  const foodDescription = (input.foodDescription ?? '').trim();
  const storageHandlingInformation = (input.storageHandlingInformation ?? '').trim();
  const pickupAddress = (input.pickupAddress ?? '').trim();
  const pickupCity = (input.pickupCity ?? '').trim();
  const allergenText = (input.allergenInformation ?? '').trim();
  const totalMeals = input.initialVegMeals + input.initialNonVegMeals;

  const failure = firstError([
    [validateFoodDescription(foodDescription), 'foodDescription'],
    [validateHandlingInformation(storageHandlingInformation), 'storageHandlingInformation'],
    [validateAddress(pickupAddress), 'pickupAddress'],
    [validateCity(pickupCity), 'pickupCity'],
    [validateLatitude(input.pickupLatitude), 'pickupLatitude'],
    [validateLongitude(input.pickupLongitude), 'pickupLongitude'],
    [validateMealQuantity(input.initialVegMeals, 'Initial veg meals'), 'initialVegMeals'],
    [validateMealQuantity(input.initialNonVegMeals, 'Initial non-veg meals'), 'initialNonVegMeals'],
    [totalMeals > 0 ? null : 'Donation must include at least one meal.', 'initialVegMeals'],
    [validateDeadline(input.bestBeforeAt, now), 'bestBeforeAt'],
    [validateDeadline(input.availableUntilAt, now), 'availableUntilAt'],
    [validateAllergenInformation(allergenText), 'allergenInformation'],
    [
      !input.allergensUnknown && !allergenText
        ? 'Allergen information is required unless allergens are unknown.'
        : null,
      'allergenInformation',
    ],
  ]);
  if (failure) {
    return failure;
  }

  const bestBeforeMs = Date.parse(input.bestBeforeAt);
  const availableUntilMs = Date.parse(input.availableUntilAt);
  if (availableUntilMs < bestBeforeMs) {
    return fail(
      'VALIDATION_ERROR',
      'Available until must be on or after the best-before time.',
      'availableUntilAt',
    );
  }

  const timestamp = now.toISOString();
  const donation: Donation = {
    id: createId(),
    donorId: input.donorId,
    foodDescription,
    initialVegMeals: input.initialVegMeals,
    remainingVegMeals: input.initialVegMeals,
    initialNonVegMeals: input.initialNonVegMeals,
    remainingNonVegMeals: input.initialNonVegMeals,
    bestBeforeAt: new Date(bestBeforeMs).toISOString(),
    availableUntilAt: new Date(availableUntilMs).toISOString(),
    pickupAddress,
    pickupCity,
    pickupLatitude: input.pickupLatitude,
    pickupLongitude: input.pickupLongitude,
    storageHandlingInformation,
    allergenInformation: allergenText ? allergenText : null,
    allergensUnknown: input.allergensUnknown,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  setStorageValue(DONATIONS_KEY, [...readDonations(), donation]);
  return ok(donation);
}
