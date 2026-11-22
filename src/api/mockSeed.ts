import { getStorageValue, setStorageValue } from './mockStorage';
import type {
  Donation,
  DeliveryService,
  DonorProfile,
  FoodRequest,
  MockUser,
  Profile,
  ReceiverProfile,
  VolunteerProfile,
} from './types';

const SEED_VERSION = 1;
const SEED_VERSION_KEY = 'foodpulse_mock_seed_version';
const DEMO_PASSWORD = 'Password123!';
const MUMBAI_CITY = 'Mumbai';
const MUMBAI_LATITUDE = 19.076;
const MUMBAI_LONGITUDE = 72.8777;
const DEMO_PHONE = '+1 555 0100';
const DAY_MS = 24 * 60 * 60 * 1000;

function appendMissing<T extends { id: string }>(key: string, items: T[]): void {
  const existing = getStorageValue<T[]>(key, []);
  const existingIds = new Set(existing.map((item) => item.id));
  const additions = items.filter((item) => !existingIds.has(item.id));
  setStorageValue(key, [...existing, ...additions]);
}

export function ensureSeedData(): void {
  if (getStorageValue<number>(SEED_VERSION_KEY, 0) === SEED_VERSION) {
    return;
  }

  const nowDate = new Date();
  const now = nowDate.toISOString();
  const daysFromNow = (days: number): string => new Date(nowDate.getTime() + days * DAY_MS).toISOString();

  const users: MockUser[] = [
    {
      id: 'user-1',
      email: 'user@example.com',
      password: DEMO_PASSWORD,
      emailConfirmed: true,
      role: 'user',
      createdAt: now,
    },
    {
      id: 'donor-1',
      email: 'donor@example.com',
      password: DEMO_PASSWORD,
      emailConfirmed: true,
      role: 'user',
      createdAt: now,
    },
    {
      id: 'receiver-1',
      email: 'receiver@example.com',
      password: DEMO_PASSWORD,
      emailConfirmed: true,
      role: 'user',
      createdAt: now,
    },
  ];

  const profiles: Profile[] = [
    {
      id: 'user-1',
      fullName: 'Demo User',
      phoneNumber: DEMO_PHONE,
      city: MUMBAI_CITY,
      latitude: MUMBAI_LATITUDE,
      longitude: MUMBAI_LONGITUDE,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'donor-1',
      fullName: 'Demo Donor',
      phoneNumber: DEMO_PHONE,
      city: MUMBAI_CITY,
      latitude: MUMBAI_LATITUDE,
      longitude: MUMBAI_LONGITUDE,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'receiver-1',
      fullName: 'Demo Receiver',
      phoneNumber: DEMO_PHONE,
      city: MUMBAI_CITY,
      latitude: MUMBAI_LATITUDE,
      longitude: MUMBAI_LONGITUDE,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const donorProfiles: DonorProfile[] = [
    {
      id: 'donor-1',
      organizationName: 'Green Kitchen',
      organizationType: 'restaurant',
      addressLine: '12 Market Road',
      city: MUMBAI_CITY,
      latitude: MUMBAI_LATITUDE,
      longitude: MUMBAI_LONGITUDE,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const receiverProfiles: ReceiverProfile[] = [
    {
      id: 'receiver-1',
      organizationName: 'Hope Shelter',
      organizationType: 'shelter',
      contactEmail: 'receiver@example.com',
      addressLine: '45 Relief Lane',
      city: MUMBAI_CITY,
      latitude: MUMBAI_LATITUDE,
      longitude: MUMBAI_LONGITUDE,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const volunteerProfiles: VolunteerProfile[] = [
    {
      id: 'user-1',
      available: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const donations: Donation[] = [
    {
      id: 'donation-1',
      donorId: 'donor-1',
      foodDescription: 'Mixed vegetarian and non-vegetarian meals',
      initialVegMeals: 20,
      remainingVegMeals: 12,
      initialNonVegMeals: 10,
      remainingNonVegMeals: 10,
      bestBeforeAt: daysFromNow(1),
      availableUntilAt: daysFromNow(2),
      pickupAddress: '12 Market Road',
      pickupCity: MUMBAI_CITY,
      pickupLatitude: MUMBAI_LATITUDE,
      pickupLongitude: MUMBAI_LONGITUDE,
      storageHandlingInformation: 'Keep refrigerated and reheat thoroughly before serving.',
      allergenInformation: 'Contains nuts',
      allergensUnknown: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'donation-2',
      donorId: 'donor-1',
      foodDescription: 'Vegetarian rice and dal meals',
      initialVegMeals: 15,
      remainingVegMeals: 15,
      initialNonVegMeals: 0,
      remainingNonVegMeals: 0,
      bestBeforeAt: daysFromNow(3),
      availableUntilAt: daysFromNow(4),
      pickupAddress: '12 Market Road',
      pickupCity: MUMBAI_CITY,
      pickupLatitude: MUMBAI_LATITUDE,
      pickupLongitude: MUMBAI_LONGITUDE,
      storageHandlingInformation: 'Keep covered and store below 5 C until pickup.',
      allergenInformation: null,
      allergensUnknown: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const foodRequests: FoodRequest[] = [
    {
      id: 'request-1',
      receiverId: 'receiver-1',
      initialTotalMeals: 30,
      remainingTotalMeals: 18,
      initialPureVegMeals: 20,
      remainingPureVegMeals: 12,
      neededBeforeAt: daysFromNow(2),
      receivingAddress: '45 Relief Lane',
      receivingCity: MUMBAI_CITY,
      receivingLatitude: MUMBAI_LATITUDE,
      receivingLongitude: MUMBAI_LONGITUDE,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'request-2',
      receiverId: 'receiver-1',
      initialTotalMeals: 10,
      remainingTotalMeals: 10,
      initialPureVegMeals: 5,
      remainingPureVegMeals: 5,
      neededBeforeAt: daysFromNow(5),
      receivingAddress: '45 Relief Lane',
      receivingCity: MUMBAI_CITY,
      receivingLatitude: MUMBAI_LATITUDE,
      receivingLongitude: MUMBAI_LONGITUDE,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const deliveryServices: DeliveryService[] = [
    {
      id: 'delivery-service-1',
      volunteerId: 'user-1',
      status: 'active',
      createdAt: now,
      endedAt: null,
    },
  ];

  appendMissing<MockUser>('foodpulse_mock_users', users);
  appendMissing<Profile>('foodpulse_mock_profiles', profiles);
  appendMissing<DonorProfile>('foodpulse_mock_donor_profiles', donorProfiles);
  appendMissing<ReceiverProfile>('foodpulse_mock_receiver_profiles', receiverProfiles);
  appendMissing<VolunteerProfile>('foodpulse_mock_volunteer_profiles', volunteerProfiles);
  appendMissing<Donation>('foodpulse_mock_donations', donations);
  appendMissing<FoodRequest>('foodpulse_mock_food_requests', foodRequests);
  appendMissing<DeliveryService>('foodpulse_mock_delivery_services', deliveryServices);

  setStorageValue(SEED_VERSION_KEY, SEED_VERSION);
}
