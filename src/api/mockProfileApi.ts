import { delay, fail, ok } from './mockDelay';
import { getStorageValue, setStorageValue } from './mockStorage';
import type {
  DonorProfile,
  MockApiResponse,
  MockUser,
  Profile,
  ReceiverProfile,
  VolunteerProfile,
} from './types';
import {
  validateAddress,
  validateCity,
  validateEmail,
  validateFullName,
  validateLatitude,
  validateLongitude,
  validateOrganizationName,
  validatePhone,
} from './validation';

const USERS_KEY = 'foodpulse_mock_users';
const PROFILES_KEY = 'foodpulse_mock_profiles';
const DONOR_PROFILES_KEY = 'foodpulse_mock_donor_profiles';
const RECEIVER_PROFILES_KEY = 'foodpulse_mock_receiver_profiles';
const VOLUNTEER_PROFILES_KEY = 'foodpulse_mock_volunteer_profiles';

const DONOR_ORGANIZATION_TYPES = [
  'restaurant',
  'caterer',
  'hostel_mess',
  'canteen',
  'event_organizer',
] as const;

const RECEIVER_ORGANIZATION_TYPES = ['ngo', 'shelter', 'community_kitchen', 'other'] as const;

type ProfileMap<T> = Record<string, T>;

interface FieldError {
  message: string;
  field: string;
}

function userExists(userId: string): boolean {
  const users = getStorageValue<MockUser[]>(USERS_KEY, []);
  return users.some((user) => user.id === userId);
}

function isOneOf<T extends string>(allowed: readonly T[], value: string): value is T {
  return (allowed as readonly string[]).includes(value);
}

function validateOrganizationFields(input: {
  organizationName: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
}): FieldError | null {
  const organizationNameError = validateOrganizationName(input.organizationName);
  if (organizationNameError) {
    return { message: organizationNameError, field: 'organizationName' };
  }
  const addressError = validateAddress(input.addressLine);
  if (addressError) {
    return { message: addressError, field: 'addressLine' };
  }
  const cityError = validateCity(input.city);
  if (cityError) {
    return { message: cityError, field: 'city' };
  }
  const latitudeError = validateLatitude(input.latitude);
  if (latitudeError) {
    return { message: latitudeError, field: 'latitude' };
  }
  const longitudeError = validateLongitude(input.longitude);
  if (longitudeError) {
    return { message: longitudeError, field: 'longitude' };
  }
  return null;
}

export async function getProfile(userId: string): Promise<MockApiResponse<Profile | null>> {
  await delay();
  const profiles = getStorageValue<ProfileMap<Profile>>(PROFILES_KEY, {});
  return ok(profiles[userId] ?? null);
}

export async function upsertProfile(
  input: Omit<Profile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<Profile>> {
  await delay();

  const fullNameError = validateFullName(input.fullName);
  if (fullNameError) {
    return fail('VALIDATION_ERROR', fullNameError, 'fullName');
  }
  const phoneError = validatePhone(input.phoneNumber);
  if (phoneError) {
    return fail('VALIDATION_ERROR', phoneError, 'phoneNumber');
  }
  const cityError = validateCity(input.city);
  if (cityError) {
    return fail('VALIDATION_ERROR', cityError, 'city');
  }
  const latitudeError = validateLatitude(input.latitude);
  if (latitudeError) {
    return fail('VALIDATION_ERROR', latitudeError, 'latitude');
  }
  const longitudeError = validateLongitude(input.longitude);
  if (longitudeError) {
    return fail('VALIDATION_ERROR', longitudeError, 'longitude');
  }

  if (!userExists(input.id)) {
    return fail('NOT_FOUND', 'User not found.');
  }

  const profiles = getStorageValue<ProfileMap<Profile>>(PROFILES_KEY, {});
  const now = new Date().toISOString();
  const profile: Profile = {
    id: input.id,
    fullName: input.fullName.trim(),
    phoneNumber: input.phoneNumber.trim(),
    city: input.city.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    role: 'user',
    createdAt: profiles[input.id]?.createdAt ?? now,
    updatedAt: now,
  };

  setStorageValue<ProfileMap<Profile>>(PROFILES_KEY, { ...profiles, [input.id]: profile });
  return ok(profile);
}

export async function getDonorProfile(userId: string): Promise<MockApiResponse<DonorProfile | null>> {
  await delay();
  const profiles = getStorageValue<ProfileMap<DonorProfile>>(DONOR_PROFILES_KEY, {});
  return ok(profiles[userId] ?? null);
}

export async function upsertDonorProfile(
  input: Omit<DonorProfile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<DonorProfile>> {
  await delay();

  if (!isOneOf(DONOR_ORGANIZATION_TYPES, input.organizationType)) {
    return fail('VALIDATION_ERROR', 'Organization type is not valid.', 'organizationType');
  }
  const orgError = validateOrganizationFields(input);
  if (orgError) {
    return fail('VALIDATION_ERROR', orgError.message, orgError.field);
  }

  if (!userExists(input.id)) {
    return fail('NOT_FOUND', 'User not found.');
  }

  const profiles = getStorageValue<ProfileMap<DonorProfile>>(DONOR_PROFILES_KEY, {});
  const now = new Date().toISOString();
  const profile: DonorProfile = {
    id: input.id,
    organizationName: input.organizationName.trim(),
    organizationType: input.organizationType,
    addressLine: input.addressLine.trim(),
    city: input.city.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    createdAt: profiles[input.id]?.createdAt ?? now,
    updatedAt: now,
  };

  setStorageValue<ProfileMap<DonorProfile>>(DONOR_PROFILES_KEY, { ...profiles, [input.id]: profile });
  return ok(profile);
}

export async function getReceiverProfile(
  userId: string,
): Promise<MockApiResponse<ReceiverProfile | null>> {
  await delay();
  const profiles = getStorageValue<ProfileMap<ReceiverProfile>>(RECEIVER_PROFILES_KEY, {});
  return ok(profiles[userId] ?? null);
}

export async function upsertReceiverProfile(
  input: Omit<ReceiverProfile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<ReceiverProfile>> {
  await delay();

  if (!isOneOf(RECEIVER_ORGANIZATION_TYPES, input.organizationType)) {
    return fail('VALIDATION_ERROR', 'Organization type is not valid.', 'organizationType');
  }
  const orgError = validateOrganizationFields(input);
  if (orgError) {
    return fail('VALIDATION_ERROR', orgError.message, orgError.field);
  }
  const emailError = validateEmail(input.contactEmail);
  if (emailError) {
    return fail('VALIDATION_ERROR', emailError, 'contactEmail');
  }
  const email = input.contactEmail.trim();
  if (email.length < 3 || email.length > 320) {
    return fail('VALIDATION_ERROR', 'Contact email must be between 3 and 320 characters.', 'contactEmail');
  }

  if (!userExists(input.id)) {
    return fail('NOT_FOUND', 'User not found.');
  }

  const profiles = getStorageValue<ProfileMap<ReceiverProfile>>(RECEIVER_PROFILES_KEY, {});
  const now = new Date().toISOString();
  const profile: ReceiverProfile = {
    id: input.id,
    organizationName: input.organizationName.trim(),
    organizationType: input.organizationType,
    contactEmail: email,
    addressLine: input.addressLine.trim(),
    city: input.city.trim(),
    latitude: input.latitude,
    longitude: input.longitude,
    createdAt: profiles[input.id]?.createdAt ?? now,
    updatedAt: now,
  };

  setStorageValue<ProfileMap<ReceiverProfile>>(RECEIVER_PROFILES_KEY, { ...profiles, [input.id]: profile });
  return ok(profile);
}

export async function getVolunteerProfile(
  userId: string,
): Promise<MockApiResponse<VolunteerProfile | null>> {
  await delay();
  const profiles = getStorageValue<ProfileMap<VolunteerProfile>>(VOLUNTEER_PROFILES_KEY, {});
  return ok(profiles[userId] ?? null);
}

export async function upsertVolunteerProfile(
  input: Omit<VolunteerProfile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<VolunteerProfile>> {
  await delay();

  if (typeof input.available !== 'boolean') {
    return fail('VALIDATION_ERROR', 'Availability must be true or false.', 'available');
  }

  if (!userExists(input.id)) {
    return fail('NOT_FOUND', 'User not found.');
  }

  const profiles = getStorageValue<ProfileMap<VolunteerProfile>>(VOLUNTEER_PROFILES_KEY, {});
  const now = new Date().toISOString();
  const profile: VolunteerProfile = {
    id: input.id,
    available: input.available,
    createdAt: profiles[input.id]?.createdAt ?? now,
    updatedAt: now,
  };

  setStorageValue<ProfileMap<VolunteerProfile>>(VOLUNTEER_PROFILES_KEY, { ...profiles, [input.id]: profile });
  return ok(profile);
}
