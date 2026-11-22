import type {
  DashboardSummary,
  Donation,
  DonorProfile,
  DeliveryService,
  FoodRequest,
  MockApiResponse,
  ReceiverProfile,
  VolunteerProfile,
} from './types';
import { delay, ok } from './mockDelay';
import { getStorageValue } from './mockStorage';

const DAY_MS = 24 * 60 * 60 * 1000;

const TERMINAL_SERVICE_STATUSES: ReadonlyArray<DeliveryService['status']> = [
  'delivered',
  'declined',
  'cancelled',
  'failed',
];

function isSameLocalDay(isoDate: string, now: Date): boolean {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isWithinDaysBeforeNow(isoDate: string, now: Date, days: number): boolean {
  const time = Date.parse(isoDate);
  if (Number.isNaN(time)) {
    return false;
  }
  const nowMs = now.getTime();
  return time >= nowMs - days * DAY_MS && time <= nowMs;
}

function donatedMealsOf(donation: Donation): number {
  const initial = donation.initialVegMeals + donation.initialNonVegMeals;
  const remaining = donation.remainingVegMeals + donation.remainingNonVegMeals;
  return initial - remaining;
}

export async function getDashboardSummary(userId: string): Promise<MockApiResponse<DashboardSummary>> {
  await delay();

  const now = new Date();
  const nowMs = now.getTime();

  const donations = getStorageValue<Donation[]>('foodpulse_mock_donations', []).filter(
    (donation) => donation.donorId === userId,
  );
  const requests = getStorageValue<FoodRequest[]>('foodpulse_mock_food_requests', []).filter(
    (request) => request.receiverId === userId,
  );
  const services = getStorageValue<DeliveryService[]>('foodpulse_mock_delivery_services', []).filter(
    (service) => service.volunteerId === userId,
  );
  const donorProfiles = getStorageValue<DonorProfile[]>('foodpulse_mock_donor_profiles', []);
  const receiverProfiles = getStorageValue<ReceiverProfile[]>('foodpulse_mock_receiver_profiles', []);
  const volunteerProfiles = getStorageValue<VolunteerProfile[]>('foodpulse_mock_volunteer_profiles', []);

  const todayDonatedMeals = donations
    .filter((donation) => isSameLocalDay(donation.createdAt, now))
    .reduce((sum, donation) => sum + donatedMealsOf(donation), 0);

  const todayRequestedMeals = requests
    .filter((request) => isSameLocalDay(request.createdAt, now))
    .reduce((sum, request) => sum + request.initialTotalMeals, 0);

  const todayVolunteerDeliveries = services.filter((service) =>
    isSameLocalDay(service.createdAt, now),
  ).length;

  const donatedMealsLast7Days = donations
    .filter((donation) => isWithinDaysBeforeNow(donation.createdAt, now, 7))
    .reduce((sum, donation) => sum + donatedMealsOf(donation), 0);

  const donatedMealsLast30Days = donations
    .filter((donation) => isWithinDaysBeforeNow(donation.createdAt, now, 30))
    .reduce((sum, donation) => sum + donatedMealsOf(donation), 0);

  const requestedMealsLast7Days = requests
    .filter((request) => isWithinDaysBeforeNow(request.createdAt, now, 7))
    .reduce((sum, request) => sum + request.initialTotalMeals, 0);

  const requestedMealsLast30Days = requests
    .filter((request) => isWithinDaysBeforeNow(request.createdAt, now, 30))
    .reduce((sum, request) => sum + request.initialTotalMeals, 0);

  const volunteerDeliveriesLast7Days = services.filter((service) =>
    isWithinDaysBeforeNow(service.createdAt, now, 7),
  ).length;

  const volunteerDeliveriesLast30Days = services.filter((service) =>
    isWithinDaysBeforeNow(service.createdAt, now, 30),
  ).length;

  const activeDonationsCount = donations.filter((donation) => {
    const availableUntil = Date.parse(donation.availableUntilAt);
    const remaining = donation.remainingVegMeals + donation.remainingNonVegMeals;
    return !Number.isNaN(availableUntil) && availableUntil > nowMs && remaining > 0;
  }).length;

  const activeRequestsCount = requests.filter((request) => {
    const neededBefore = Date.parse(request.neededBeforeAt);
    return !Number.isNaN(neededBefore) && neededBefore > nowMs && request.remainingTotalMeals > 0;
  }).length;

  const activeVolunteerService =
    services.find((service) => !TERMINAL_SERVICE_STATUSES.includes(service.status)) ?? null;

  const summary: DashboardSummary = {
    todayDonatedMeals,
    todayRequestedMeals,
    todayVolunteerDeliveries,
    donatedMealsLast7Days,
    donatedMealsLast30Days,
    requestedMealsLast7Days,
    requestedMealsLast30Days,
    volunteerDeliveriesLast7Days,
    volunteerDeliveriesLast30Days,
    activeDonationsCount,
    activeRequestsCount,
    activeVolunteerService,
    hasDonorProfile: donorProfiles.some((profile) => profile.id === userId),
    hasReceiverProfile: receiverProfiles.some((profile) => profile.id === userId),
    hasVolunteerProfile: volunteerProfiles.some((profile) => profile.id === userId),
  };

  return ok(summary);
}
