import { supabase } from '@/lib/supabase';
import type {
  Profile,
  DonorProfile,
  ReceiverProfile,
  VolunteerProfile,
  Donation,
  FoodRequest,
  DeliveryService,
  DashboardSummary,
  ActiveDeliveryOrder,
  MockApiResponse,
  MatchAllocation,
} from './types';
import { getStorageValue, setStorageValue } from './mockStorage';
import * as mockProfileApi from './mockProfileApi';
import * as mockDonationApi from './mockDonationApi';
import * as mockRequestApi from './mockRequestApi';
import * as mockVolunteerApi from './mockVolunteerApi';
import * as mockDashboardApi from './mockDashboardApi';

// Helper to convert snake_case postgres row to Profile
function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: String(row.id),
    fullName: String(row.full_name ?? ''),
    phoneNumber: String(row.phone_number ?? ''),
    city: String(row.city ?? ''),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    role: (row.role as 'user' | 'admin') ?? 'user',
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function toDonorProfile(row: Record<string, unknown>): DonorProfile {
  return {
    id: String(row.id),
    organizationName: String(row.organization_name ?? ''),
    organizationType: (row.organization_type as DonorProfile['organizationType']) ?? 'restaurant',
    addressLine: String(row.address_line ?? ''),
    city: String(row.city ?? ''),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function toReceiverProfile(row: Record<string, unknown>): ReceiverProfile {
  return {
    id: String(row.id),
    organizationName: String(row.organization_name ?? ''),
    organizationType: (row.organization_type as ReceiverProfile['organizationType']) ?? 'shelter',
    contactEmail: String(row.contact_email ?? ''),
    addressLine: String(row.address_line ?? ''),
    city: String(row.city ?? ''),
    latitude: Number(row.latitude ?? 0),
    longitude: Number(row.longitude ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function toVolunteerProfile(row: Record<string, unknown>): VolunteerProfile {
  return {
    id: String(row.id),
    available: Boolean(row.is_available ?? true),
    vehicleType: row.vehicle_type ? String(row.vehicle_type) : undefined,
    maxMealCapacity: row.max_meals_capacity ? Number(row.max_meals_capacity) : undefined,
    operatingCity: row.operating_city ? String(row.operating_city) : undefined,
    baseAddress: row.base_address ? String(row.base_address) : undefined,
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    contactPhone: row.contact_phone ? String(row.contact_phone) : undefined,
    schedulePreference: row.schedule_preference ? String(row.schedule_preference) : undefined,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function toDonation(row: Record<string, unknown>): Donation {
  return {
    id: String(row.id),
    donorId: String(row.donor_id),
    foodDescription: String(row.food_description),
    initialVegMeals: Number(row.initial_veg_meals),
    remainingVegMeals: Number(row.remaining_veg_meals),
    initialNonVegMeals: Number(row.initial_non_veg_meals),
    remainingNonVegMeals: Number(row.remaining_non_veg_meals),
    bestBeforeAt: String(row.best_before_at),
    availableUntilAt: String(row.available_until_at),
    pickupAddress: String(row.pickup_address),
    pickupCity: String(row.pickup_city),
    pickupLatitude: Number(row.pickup_latitude),
    pickupLongitude: Number(row.pickup_longitude),
    storageHandlingInformation: String(row.storage_handling_information),
    allergenInformation: row.allergen_information ? String(row.allergen_information) : null,
    allergensUnknown: Boolean(row.allergens_unknown),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function toFoodRequest(row: Record<string, unknown>): FoodRequest {
  return {
    id: String(row.id),
    receiverId: String(row.receiver_id),
    initialTotalMeals: Number(row.initial_total_meals),
    remainingTotalMeals: Number(row.remaining_total_meals),
    initialPureVegMeals: Number(row.initial_pure_veg_meals),
    remainingPureVegMeals: Number(row.remaining_pure_veg_meals),
    neededBeforeAt: String(row.needed_before_at),
    receivingAddress: String(row.receiving_address),
    receivingCity: String(row.receiving_city),
    receivingLatitude: Number(row.receiving_latitude),
    receivingLongitude: Number(row.receiving_longitude),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

// -------------------------------------------------------------
// Profiles API
// -------------------------------------------------------------
export async function getProfile(userId: string): Promise<MockApiResponse<Profile | null>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Supabase getProfile error, falling back:', error.message);
      return mockProfileApi.getProfile(userId);
    }
    return { data: data ? toProfile(data) : null, error: null };
  } catch (err) {
    console.warn('Supabase getProfile exception:', err);
    return mockProfileApi.getProfile(userId);
  }
}

export async function upsertProfile(
  input: Omit<Profile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<Profile>> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: input.id,
        full_name: input.fullName.trim(),
        phone_number: input.phoneNumber.trim(),
        city: input.city.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.warn('Supabase upsertProfile error, falling back:', error.message);
      return mockProfileApi.upsertProfile(input);
    }
    return { data: toProfile(data), error: null };
  } catch (err) {
    console.warn('Supabase upsertProfile exception:', err);
    return mockProfileApi.upsertProfile(input);
  }
}

// -------------------------------------------------------------
// Donor Profile API
// -------------------------------------------------------------
export async function getDonorProfile(userId: string): Promise<MockApiResponse<DonorProfile | null>> {
  try {
    const { data, error } = await supabase
      .from('donor_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return mockProfileApi.getDonorProfile(userId);
    }
    return { data: data ? toDonorProfile(data) : null, error: null };
  } catch {
    return mockProfileApi.getDonorProfile(userId);
  }
}

export async function upsertDonorProfile(
  input: Omit<DonorProfile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<DonorProfile>> {
  try {
    const { data, error } = await supabase
      .from('donor_profiles')
      .upsert({
        id: input.id,
        organization_name: input.organizationName.trim(),
        organization_type: input.organizationType,
        address_line: input.addressLine.trim(),
        city: input.city.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return mockProfileApi.upsertDonorProfile(input);
    }
    return { data: toDonorProfile(data), error: null };
  } catch {
    return mockProfileApi.upsertDonorProfile(input);
  }
}

// -------------------------------------------------------------
// Receiver Profile API
// -------------------------------------------------------------
export async function getReceiverProfile(userId: string): Promise<MockApiResponse<ReceiverProfile | null>> {
  try {
    const { data, error } = await supabase
      .from('receiver_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return mockProfileApi.getReceiverProfile(userId);
    }
    return { data: data ? toReceiverProfile(data) : null, error: null };
  } catch {
    return mockProfileApi.getReceiverProfile(userId);
  }
}

export async function upsertReceiverProfile(
  input: Omit<ReceiverProfile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<ReceiverProfile>> {
  try {
    const { data, error } = await supabase
      .from('receiver_profiles')
      .upsert({
        id: input.id,
        organization_name: input.organizationName.trim(),
        organization_type: input.organizationType,
        contact_email: input.contactEmail.trim().toLowerCase(),
        address_line: input.addressLine.trim(),
        city: input.city.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return mockProfileApi.upsertReceiverProfile(input);
    }
    return { data: toReceiverProfile(data), error: null };
  } catch {
    return mockProfileApi.upsertReceiverProfile(input);
  }
}

// -------------------------------------------------------------
// Volunteer Profile API
// -------------------------------------------------------------
export async function getVolunteerProfile(userId: string): Promise<MockApiResponse<VolunteerProfile | null>> {
  try {
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return mockProfileApi.getVolunteerProfile(userId);
    }
    return { data: data ? toVolunteerProfile(data) : null, error: null };
  } catch {
    return mockProfileApi.getVolunteerProfile(userId);
  }
}

export async function upsertVolunteerProfile(
  input: Omit<VolunteerProfile, 'createdAt' | 'updatedAt'>,
): Promise<MockApiResponse<VolunteerProfile>> {
  try {
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .upsert({
        id: input.id,
        is_available: input.available,
        vehicle_type: input.vehicleType ?? null,
        max_meals_capacity: input.maxMealCapacity ?? null,
        operating_city: input.operatingCity ?? null,
        base_address: input.baseAddress ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        contact_phone: input.contactPhone ?? null,
        schedule_preference: input.schedulePreference ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return mockProfileApi.upsertVolunteerProfile(input);
    }
    return { data: toVolunteerProfile(data), error: null };
  } catch {
    return mockProfileApi.upsertVolunteerProfile(input);
  }
}

export async function setVolunteerAvailability(
  userId: string,
  available: boolean,
): Promise<MockApiResponse<VolunteerProfile>> {
  try {
    // Attempt updating remote if is_available exists, or update local state
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .update({ is_available: available, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return mockVolunteerApi.setVolunteerAvailability(userId, available);
    }
    return { data: toVolunteerProfile(data), error: null };
  } catch {
    return mockVolunteerApi.setVolunteerAvailability(userId, available);
  }
}

export async function getVolunteerService(
  userId: string,
): Promise<MockApiResponse<DeliveryService | null>> {
  try {
    const { data, error } = await supabase
      .from('FoodPulse_delivery_services')
      .select('*')
      .eq('volunteer_id', userId)
      .in('status', ['assigned', 'accepted', 'active', 'picked_up', 'in_transit'])
      .maybeSingle();

    if (error) {
      return mockVolunteerApi.getVolunteerService(userId);
    }
    if (!data) return { data: null, error: null };
    return {
      data: {
        id: data.id,
        volunteerId: data.volunteer_id,
        status: data.status,
        createdAt: data.created_at,
        endedAt: data.ended_at ?? null,
      },
      error: null,
    };
  } catch {
    return mockVolunteerApi.getVolunteerService(userId);
  }
}

// -------------------------------------------------------------
// Donations API
// -------------------------------------------------------------
export async function listDonations(userId: string): Promise<MockApiResponse<Donation[]>> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .select('id, donor_id, food_description, initial_veg_meals, remaining_veg_meals, initial_non_veg_meals, remaining_non_veg_meals, best_before_at, available_until_at, pickup_address, pickup_city, pickup_latitude, pickup_longitude, storage_handling_information, allergen_information, allergens_unknown, created_at, updated_at')
      .eq('donor_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return mockDonationApi.listDonations(userId);
    }
    return { data: (data ?? []).map(toDonation), error: null };
  } catch {
    return mockDonationApi.listDonations(userId);
  }
}

export async function createDonation(input: mockDonationApi.CreateDonationInput): Promise<MockApiResponse<Donation>> {
  try {
    const { data, error } = await supabase
      .from('donations')
      .insert({
        donor_id: input.donorId,
        food_description: input.foodDescription.trim(),
        initial_veg_meals: input.initialVegMeals,
        initial_non_veg_meals: input.initialNonVegMeals,
        best_before_at: input.bestBeforeAt,
        available_until_at: input.availableUntilAt,
        pickup_address: input.pickupAddress.trim(),
        pickup_city: input.pickupCity.trim(),
        pickup_latitude: input.pickupLatitude,
        pickup_longitude: input.pickupLongitude,
        storage_handling_information: input.storageHandlingInformation.trim(),
        allergen_information: input.allergenInformation?.trim() || null,
        allergens_unknown: input.allergensUnknown,
      })
      .select()
      .single();

    if (error) {
      return mockDonationApi.createDonation(input);
    }
    return { data: toDonation(data), error: null };
  } catch {
    return mockDonationApi.createDonation(input);
  }
}

// -------------------------------------------------------------
// Food Requests API
// -------------------------------------------------------------
export async function listFoodRequests(userId: string): Promise<MockApiResponse<FoodRequest[]>> {
  try {
    const { data, error } = await supabase
      .from('food_requests')
      .select('id, receiver_id, initial_total_meals, remaining_total_meals, initial_pure_veg_meals, remaining_pure_veg_meals, needed_before_at, receiving_address, receiving_city, receiving_latitude, receiving_longitude, created_at, updated_at')
      .eq('receiver_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return mockRequestApi.listFoodRequests(userId);
    }
    return { data: (data ?? []).map(toFoodRequest), error: null };
  } catch {
    return mockRequestApi.listFoodRequests(userId);
  }
}

export async function createFoodRequest(input: mockRequestApi.CreateFoodRequestInput): Promise<MockApiResponse<FoodRequest>> {
  try {
    const { data, error } = await supabase
      .from('food_requests')
      .insert({
        receiver_id: input.receiverId,
        initial_total_meals: input.initialTotalMeals,
        initial_pure_veg_meals: input.initialPureVegMeals,
        needed_before_at: input.neededBeforeAt,
        receiving_address: input.receivingAddress.trim(),
        receiving_city: input.receivingCity.trim(),
        receiving_latitude: input.receivingLatitude,
        receiving_longitude: input.receivingLongitude,
      })
      .select()
      .single();

    if (error) {
      return mockRequestApi.createFoodRequest(input);
    }
    return { data: toFoodRequest(data), error: null };
  } catch {
    return mockRequestApi.createFoodRequest(input);
  }
}

// -------------------------------------------------------------
// Dashboard Summary API (PRD §6)
// -------------------------------------------------------------
export async function getDashboardSummary(userId: string): Promise<MockApiResponse<DashboardSummary>> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      donationsRes,
      requestsRes,
      servicesRes,
      donorProfileRes,
      receiverProfileRes,
      volunteerProfileRes,
    ] = await Promise.all([
      supabase
        .from('donations')
        .select('*')
        .eq('donor_id', userId)
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('food_requests')
        .select('*')
        .eq('receiver_id', userId)
        .gte('created_at', thirtyDaysAgo),
      supabase
        .from('FoodPulse_delivery_services')
        .select('*')
        .eq('volunteer_id', userId)
        .gte('created_at', thirtyDaysAgo),
      supabase.from('donor_profiles').select('id').eq('id', userId).maybeSingle(),
      supabase.from('receiver_profiles').select('id').eq('id', userId).maybeSingle(),
      supabase.from('volunteer_profiles').select('id').eq('id', userId).maybeSingle(),
    ]);

    if (donationsRes.error && donationsRes.error.message.includes('fetch')) {
      return mockDashboardApi.getDashboardSummary(userId);
    }

    const now = new Date();
    const nowMs = now.getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;

    const donations = (donationsRes.data ?? []).map(toDonation);
    const requests = (requestsRes.data ?? []).map(toFoodRequest);
    const services: DeliveryService[] = (servicesRes.data ?? []).map((s: Record<string, unknown>) => ({
      id: String(s.id),
      volunteerId: String(s.volunteer_id),
      status: s.status as DeliveryService['status'],
      createdAt: String(s.created_at),
      endedAt: s.ended_at ? String(s.ended_at) : null,
    }));

    const isSameDay = (isoDate: string) => {
      const d = new Date(isoDate);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    };

    const isWithinDays = (isoDate: string, days: number) => {
      const t = Date.parse(isoDate);
      return !Number.isNaN(t) && t >= nowMs - days * DAY_MS && t <= nowMs;
    };

    const donatedMealsOf = (d: Donation) =>
      d.initialVegMeals + d.initialNonVegMeals - (d.remainingVegMeals + d.remainingNonVegMeals);

    const summary: DashboardSummary = {
      todayDonatedMeals: donations.filter((d) => isSameDay(d.createdAt)).reduce((acc, d) => acc + donatedMealsOf(d), 0),
      todayRequestedMeals: requests.filter((r) => isSameDay(r.createdAt)).reduce((acc, r) => acc + r.initialTotalMeals, 0),
      todayVolunteerDeliveries: services.filter((s) => isSameDay(s.createdAt) && s.status === 'delivered').length,
      donatedMealsLast7Days: donations.filter((d) => isWithinDays(d.createdAt, 7)).reduce((acc, d) => acc + donatedMealsOf(d), 0),
      donatedMealsLast30Days: donations.filter((d) => isWithinDays(d.createdAt, 30)).reduce((acc, d) => acc + donatedMealsOf(d), 0),
      requestedMealsLast7Days: requests.filter((r) => isWithinDays(r.createdAt, 7)).reduce((acc, r) => acc + r.initialTotalMeals, 0),
      requestedMealsLast30Days: requests.filter((r) => isWithinDays(r.createdAt, 30)).reduce((acc, r) => acc + r.initialTotalMeals, 0),
      volunteerDeliveriesLast7Days: services.filter((s) => isWithinDays(s.createdAt, 7) && s.status === 'delivered').length,
      volunteerDeliveriesLast30Days: services.filter((s) => isWithinDays(s.createdAt, 30) && s.status === 'delivered').length,
      activeDonationsCount: donations.filter((d) => {
        const bb = Date.parse(d.bestBeforeAt);
        const au = Date.parse(d.availableUntilAt);
        return !Number.isNaN(bb) && bb > nowMs && !Number.isNaN(au) && au > nowMs && (d.remainingVegMeals + d.remainingNonVegMeals) > 0;
      }).length,
      activeRequestsCount: requests.filter((r) => {
        const nb = Date.parse(r.neededBeforeAt);
        return !Number.isNaN(nb) && nb > nowMs && r.remainingTotalMeals > 0;
      }).length,
      activeVolunteerService: services.find((s) => ['assigned', 'accepted', 'active', 'picked_up', 'in_transit'].includes(s.status)) ?? null,
      hasDonorProfile: Boolean(donorProfileRes.data),
      hasReceiverProfile: Boolean(receiverProfileRes.data),
      hasVolunteerProfile: Boolean(volunteerProfileRes.data),
    };

    return { data: summary, error: null };
  } catch {
    return mockDashboardApi.getDashboardSummary(userId);
  }
}

// -------------------------------------------------------------
// Active Delivery Orders for Volunteer
// -------------------------------------------------------------
export async function getActiveOrdersForVolunteer(
  city?: string,
): Promise<MockApiResponse<ActiveDeliveryOrder[]>> {
  try {
    const nowIso = new Date().toISOString();

    const { data: donationsData } = await supabase
      .from('donations')
      .select('*')
      .gt('available_until_at', nowIso)
      .gt('best_before_at', nowIso)
      .order('created_at', { ascending: false });

    const { data: requestsData } = await supabase
      .from('food_requests')
      .select('*')
      .gt('needed_before_at', nowIso)
      .order('created_at', { ascending: false });

    const donations = (donationsData ?? [])
      .map(toDonation)
      .filter((d) => d.remainingVegMeals + d.remainingNonVegMeals > 0);
    const requests = (requestsData ?? []).map(toFoodRequest).filter((r) => r.remainingTotalMeals > 0);

    if (donations.length > 0 || requests.length > 0) {
      const orders: ActiveDeliveryOrder[] = [];
      for (let i = 0; i < donations.length; i++) {
        const d = donations[i];
        const r = requests[i % Math.max(requests.length, 1)] ?? null;

        orders.push({
          id: `order-${d.id.slice(0, 8)}`,
          donationId: d.id,
          requestId: r?.id,
          foodDescription: d.foodDescription,
          vegMeals: d.remainingVegMeals,
          nonVegMeals: d.remainingNonVegMeals,
          totalMeals: d.remainingVegMeals + d.remainingNonVegMeals,
          pickupAddress: d.pickupAddress,
          pickupCity: d.pickupCity,
          pickupLatitude: d.pickupLatitude,
          pickupLongitude: d.pickupLongitude,
          pickupDeadline: d.availableUntilAt,
          receivingAddress: r ? r.receivingAddress : 'Community Care & Relief Kitchen',
          receivingCity: r ? r.receivingCity : d.pickupCity,
          receivingLatitude: r ? r.receivingLatitude : d.pickupLatitude + 0.012,
          receivingLongitude: r ? r.receivingLongitude : d.pickupLongitude + 0.012,
          deliveryDeadline: r ? r.neededBeforeAt : d.bestBeforeAt,
          status: 'available',
        });
      }
      return { data: orders, error: null };
    }
  } catch (err) {
    console.warn('getActiveOrdersForVolunteer remote error:', err);
  }

  // Fallback to seeded & mock storage active donations & requests
  const mockDonations = getStorageValue<Donation[]>('foodpulse_mock_donations', []);
  const mockRequests = getStorageValue<FoodRequest[]>('foodpulse_mock_food_requests', []);
  const now = Date.now();

  const activeDonations = mockDonations.filter((d) => {
    const au = Date.parse(d.availableUntilAt);
    return !Number.isNaN(au) && au > now && d.remainingVegMeals + d.remainingNonVegMeals > 0;
  });

  const activeRequests = mockRequests.filter((r) => {
    const nb = Date.parse(r.neededBeforeAt);
    return !Number.isNaN(nb) && nb > now && r.remainingTotalMeals > 0;
  });

  const orders: ActiveDeliveryOrder[] = [];
  for (let i = 0; i < activeDonations.length; i++) {
    const d = activeDonations[i];
    const r = activeRequests[i % Math.max(activeRequests.length, 1)] ?? null;

    orders.push({
      id: `order-${d.id}`,
      donationId: d.id,
      requestId: r?.id,
      foodDescription: d.foodDescription,
      vegMeals: d.remainingVegMeals,
      nonVegMeals: d.remainingNonVegMeals,
      totalMeals: d.remainingVegMeals + d.remainingNonVegMeals,
      pickupAddress: d.pickupAddress,
      pickupCity: d.pickupCity,
      pickupLatitude: d.pickupLatitude,
      pickupLongitude: d.pickupLongitude,
      pickupDeadline: d.availableUntilAt,
      receivingAddress: r ? r.receivingAddress : 'Relief Shelter distribution center',
      receivingCity: r ? r.receivingCity : d.pickupCity,
      receivingLatitude: r ? r.receivingLatitude : d.pickupLatitude + 0.012,
      receivingLongitude: r ? r.receivingLongitude : d.pickupLongitude + 0.012,
      deliveryDeadline: r ? r.neededBeforeAt : d.bestBeforeAt,
      status: 'available',
    });
  }

  return { data: orders, error: null };
}

export async function acceptDeliveryOrder(
  volunteerId: string,
  order: ActiveDeliveryOrder,
): Promise<MockApiResponse<DeliveryService>> {
  const serviceId = `srv-${Date.now().toString(36)}`;
  const now = new Date().toISOString();
  const newService: DeliveryService = {
    id: serviceId,
    volunteerId,
    status: 'accepted',
    createdAt: now,
    endedAt: null,
  };

  try {
    await supabase.from('FoodPulse_delivery_services').insert({
      id: serviceId,
      allocation_id: order.id,
      volunteer_id: volunteerId,
      status: 'accepted',
      accepted_at: now,
    });
  } catch {
    // Graceful fallback to local tracking
  }

  const services = getStorageValue<DeliveryService[]>('foodpulse_mock_delivery_services', []);
  const filtered = services.filter(
    (s) =>
      s.volunteerId !== volunteerId ||
      ['delivered', 'declined', 'cancelled', 'failed'].includes(s.status),
  );
  setStorageValue('foodpulse_mock_delivery_services', [...filtered, newService]);

  return { data: newService, error: null };
}

export async function updateDeliveryStatus(
  serviceId: string,
  status: DeliveryService['status'],
): Promise<MockApiResponse<DeliveryService>> {
  const now = new Date().toISOString();
  try {
    await supabase
      .from('FoodPulse_delivery_services')
      .update({
        status,
        updated_at: now,
        ended_at: status === 'delivered' || status === 'cancelled' ? now : null,
      })
      .eq('id', serviceId);
  } catch {
    // Graceful fallback
  }

  const services = getStorageValue<DeliveryService[]>('foodpulse_mock_delivery_services', []);
  const updated = services.map((s) => {
    if (s.id === serviceId) {
      return {
        ...s,
        status,
        endedAt: status === 'delivered' || status === 'cancelled' ? now : null,
      };
    }
    return s;
  });
  setStorageValue('foodpulse_mock_delivery_services', updated);
  const found = updated.find((s) => s.id === serviceId);
  return { data: found ?? null, error: null };
}

// ─── Matching Algorithm & Allocations ──────────────────────────────────────

/** Fetch all allocations (with enriched display data) from Supabase or localStorage. */
export async function getAllAllocations(): Promise<MockApiResponse<MatchAllocation[]>> {
  try {
    const { data, error } = await supabase
      .from('FoodPulse_match_allocations')
      .select(`
        id, donation_id, request_id, volunteer_id,
        veg_for_pure_veg, non_veg_for_flex, veg_for_flex, total_allocated,
        status, created_at,
        donations ( food_description, pickup_address, donor_id ),
        food_requests ( receiving_address ),
        volunteer_profiles ( contact_phone ),
        FoodPulse_delivery_services ( status )
      `)
      .order('created_at', { ascending: false });

    if (!error && data && Array.isArray(data) && data.length > 0) {
      const rows: MatchAllocation[] = (data as Record<string, unknown>[]).map((row) => {
        const donation = row.donations as Record<string, unknown> | null;
        const req = row.food_requests as Record<string, unknown> | null;
        const vol = row.volunteer_profiles as Record<string, unknown> | null;
        const svcArr = row.FoodPulse_delivery_services as Record<string, unknown>[] | null;
        const svc = Array.isArray(svcArr) && svcArr.length > 0 ? svcArr[0] : null;

        return {
          id: String(row.id),
          donationId: String(row.donation_id),
          requestId: row.request_id ? String(row.request_id) : null,
          volunteerId: row.volunteer_id ? String(row.volunteer_id) : null,
          vegForPureVeg: Number(row.veg_for_pure_veg ?? 0),
          nonVegForFlex: Number(row.non_veg_for_flex ?? 0),
          vegForFlex: Number(row.veg_for_flex ?? 0),
          totalAllocated: Number(row.total_allocated ?? 0),
          status: (row.status as MatchAllocation['status']) ?? 'proposed',
          createdAt: String(row.created_at ?? ''),
          foodDescription: donation?.food_description ? String(donation.food_description) : undefined,
          pickupAddress: donation?.pickup_address ? String(donation.pickup_address) : undefined,
          receivingAddress: req?.receiving_address ? String(req.receiving_address) : undefined,
          volunteerName: vol?.contact_phone ? String(vol.contact_phone) : undefined,
          deliveryStatus: svc?.status ? String(svc.status) : undefined,
        };
      });
      return { data: rows, error: null };
    }
  } catch {
    // fall through
  }

  // Fallback: build allocations from localStorage mock data
  const donations = getStorageValue<Donation[]>('foodpulse_mock_donations', []);
  const requests = getStorageValue<FoodRequest[]>('foodpulse_mock_food_requests', []);
  const services = getStorageValue<DeliveryService[]>('foodpulse_mock_delivery_services', []);
  const existing = getStorageValue<MatchAllocation[]>('foodpulse_mock_allocations', []);

  if (existing.length > 0) {
    // Enrich from local storage
    const enriched = existing.map((a) => {
      const d = donations.find((x) => x.id === a.donationId);
      const r = requests.find((x) => x.id === a.requestId);
      const svc = services.find((s) => s.id === a.id || s.id.startsWith(`srv-${a.id}`));
      return {
        ...a,
        foodDescription: d?.foodDescription ?? a.foodDescription,
        pickupAddress: d?.pickupAddress ?? a.pickupAddress,
        receivingAddress: r?.receivingAddress ?? a.receivingAddress,
        deliveryStatus: svc?.status ?? a.deliveryStatus,
      };
    });
    return { data: enriched, error: null };
  }

  return { data: [], error: null };
}

/**
 * Run the matching algorithm client-side and persist results to both
 * Supabase (FoodPulse_match_allocations) and localStorage.
 */
export async function runAndPersistMatchingCycle(): Promise<MockApiResponse<MatchAllocation[]>> {
  // Import the pure algorithm
  const { runMatchingCycle } = await import('./mockMatchingApi');
  const cycleResult = await runMatchingCycle();
  if (cycleResult.error) return { data: null, error: cycleResult.error };

  const rawResults = cycleResult.data ?? [];
  if (rawResults.length === 0) {
    return { data: [], error: null };
  }

  // Find eligible volunteers
  let availableVolunteers: { id: string; name?: string; phone?: string; vehicleType?: string }[] = [];
  try {
    const { data: volData, error: volErr } = await supabase
      .from('volunteer_profiles')
      .select('id, vehicle_type, contact_phone, is_available, profiles(full_name, phone_number)')
      .eq('is_available', true);
    if (!volErr && volData && volData.length > 0) {
      availableVolunteers = (volData as Record<string, unknown>[]).map((v) => {
        const p = v.profiles as Record<string, unknown> | null;
        return {
          id: String(v.id),
          name: p?.full_name ? String(p.full_name) : undefined,
          phone: v.contact_phone ? String(v.contact_phone) : p?.phone_number ? String(p.phone_number) : undefined,
          vehicleType: v.vehicle_type ? String(v.vehicle_type) : undefined,
        };
      });
    }
  } catch {}

  // Fallback to local volunteer profiles
  if (availableVolunteers.length === 0) {
    const localProfiles = getStorageValue<Record<string, Record<string, unknown>>>('foodpulse_mock_volunteer_profiles', {});
    const localProfilesArr: Record<string, unknown>[] = Array.isArray(localProfiles)
      ? localProfiles
      : Object.values(localProfiles);
    for (const v of localProfilesArr) {
      if (v && v.available !== false) {
        availableVolunteers.push({
          id: String(v.id),
          name: 'Demo Volunteer',
          phone: v.contactPhone ? String(v.contactPhone) : '+91 9876543212',
          vehicleType: v.vehicleType ? String(v.vehicleType) : 'motorcycle',
        });
      }
    }
  }

  // Ensure at least demo volunteer
  if (availableVolunteers.length === 0) {
    availableVolunteers.push({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Demo Volunteer',
      phone: '+91 9876543212',
      vehicleType: 'motorcycle',
    });
  }

  const now = new Date().toISOString();
  const allocations: MatchAllocation[] = rawResults.map((r, i) => {
    const assignedVol = availableVolunteers[i % availableVolunteers.length];
    return {
      id: `alloc-${Date.now()}-${i}`,
      donationId: r.donationId,
      requestId: r.requestId,
      volunteerId: assignedVol?.id ?? null,
      volunteerName: assignedVol?.name ?? assignedVol?.phone,
      vehicleType: assignedVol?.vehicleType,
      vegForPureVeg: r.vegForPureVeg,
      nonVegForFlex: r.nonVegForFlex,
      vegForFlex: r.vegForFlex,
      totalAllocated: r.totalAllocated,
      status: 'proposed' as const,
      createdAt: now,
      deliveryStatus: assignedVol ? 'assigned' : undefined,
    };
  });

  // Try Supabase RPC apply_FoodPulse_match_cycle first
  let rpcSuccess = false;
  try {
    const payload = allocations.map((a) => ({
      id: a.id,
      donation_id: a.donationId,
      request_id: a.requestId,
      volunteer_id: a.volunteerId,
      veg_for_pure_veg: a.vegForPureVeg,
      non_veg_for_flex: a.nonVegForFlex,
      veg_for_flex: a.vegForFlex,
      total_allocated: a.totalAllocated,
    }));
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('apply_FoodPulse_match_cycle', {
      p_allocations: payload,
    });
    if (!rpcErr && rpcRes) {
      rpcSuccess = true;
    }
  } catch {}

  // Fallback direct table upserts if RPC not present
  if (!rpcSuccess) {
    try {
      const rows = allocations.map((a) => ({
        id: a.id,
        donation_id: a.donationId,
        request_id: a.requestId,
        volunteer_id: a.volunteerId,
        veg_for_pure_veg: a.vegForPureVeg,
        non_veg_for_flex: a.nonVegForFlex,
        veg_for_flex: a.vegForFlex,
        total_allocated: a.totalAllocated,
        status: a.status,
      }));
      await supabase.from('FoodPulse_match_allocations').upsert(rows, { onConflict: 'id' });

      // Delivery services
      const services = allocations
        .filter((a) => a.volunteerId)
        .map((a) => ({
          id: `srv-${a.id}`,
          allocation_id: a.id,
          volunteer_id: a.volunteerId,
          status: 'assigned',
        }));
      if (services.length > 0) {
        await supabase.from('FoodPulse_delivery_services').upsert(services, { onConflict: 'id' });
      }
    } catch {
      // Graceful - saves to localStorage below
    }
  }

  // Update mock delivery services
  const existingServices = getStorageValue<DeliveryService[]>('foodpulse_mock_delivery_services', []);
  const newServices: DeliveryService[] = allocations
    .filter((a) => a.volunteerId)
    .map((a) => ({
      id: `srv-${a.id}`,
      volunteerId: a.volunteerId!,
      allocationId: a.id,
      status: 'assigned',
      createdAt: now,
      endedAt: null,
    }));
  setStorageValue('foodpulse_mock_delivery_services', [...existingServices, ...newServices]);

  // Always persist allocations to localStorage
  const existing = getStorageValue<MatchAllocation[]>('foodpulse_mock_allocations', []);
  const merged = [
    ...existing.filter(
      (e) => !allocations.some((a) => a.donationId === e.donationId && a.requestId === e.requestId),
    ),
    ...allocations,
  ];
  setStorageValue('foodpulse_mock_allocations', merged);

  // Decrement remaining balances in mock storage so cards and subsequent cycles update
  const mockDonations = getStorageValue<Donation[]>('foodpulse_mock_donations', []);
  const mockRequests = getStorageValue<FoodRequest[]>('foodpulse_mock_food_requests', []);
  for (const a of allocations) {
    const d = mockDonations.find((x) => x.id === a.donationId);
    if (d) {
      d.remainingVegMeals = Math.max(0, d.remainingVegMeals - (a.vegForPureVeg + a.vegForFlex));
      d.remainingNonVegMeals = Math.max(0, d.remainingNonVegMeals - a.nonVegForFlex);
    }
    const r = mockRequests.find((x) => x.id === a.requestId);
    if (r) {
      r.remainingTotalMeals = Math.max(0, r.remainingTotalMeals - a.totalAllocated);
      r.remainingPureVegMeals = Math.max(0, r.remainingPureVegMeals - a.vegForPureVeg);
    }
  }
  setStorageValue('foodpulse_mock_donations', mockDonations);
  setStorageValue('foodpulse_mock_food_requests', mockRequests);

  // Notify active listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('foodpulse:matching-updated', {
        detail: {
          allocations,
          count: allocations.length,
          totalMeals: allocations.reduce((s, a) => s + a.totalAllocated, 0),
          timestamp: now,
        },
      }),
    );
  }

  return { data: allocations, error: null };
}

/** Get allocations for a specific donation */
export async function getDonationAllocations(donationId: string): Promise<MockApiResponse<MatchAllocation[]>> {
  const all = await getAllAllocations();
  if (all.error) return all;
  return { data: (all.data ?? []).filter((a) => a.donationId === donationId), error: null };
}

/** Get allocations for a specific food request */
export async function getRequestAllocations(requestId: string): Promise<MockApiResponse<MatchAllocation[]>> {
  const all = await getAllAllocations();
  if (all.error) return all;
  return { data: (all.data ?? []).filter((a) => a.requestId === requestId), error: null };
}
