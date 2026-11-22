export type MockRole = 'user' | 'admin';

export interface MockSession {
  userId: string;
  email: string;
  expiresAt: string;
}

export interface MockUser {
  id: string;
  email: string;
  password: string;
  emailConfirmed: boolean;
  role: MockRole;
  createdAt: string;
}

export interface Profile {
  id: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  latitude: number;
  longitude: number;
  role: MockRole;
  createdAt: string;
  updatedAt: string;
}

export interface DonorProfile {
  id: string;
  organizationName: string;
  organizationType: 'restaurant' | 'caterer' | 'hostel_mess' | 'canteen' | 'event_organizer';
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReceiverProfile {
  id: string;
  organizationName: string;
  organizationType: 'ngo' | 'shelter' | 'community_kitchen' | 'other';
  contactEmail: string;
  addressLine: string;
  city: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface VolunteerProfile {
  id: string;
  available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: string;
  donorId: string;
  foodDescription: string;
  initialVegMeals: number;
  remainingVegMeals: number;
  initialNonVegMeals: number;
  remainingNonVegMeals: number;
  bestBeforeAt: string;
  availableUntilAt: string;
  pickupAddress: string;
  pickupCity: string;
  pickupLatitude: number;
  pickupLongitude: number;
  storageHandlingInformation: string;
  allergenInformation: string | null;
  allergensUnknown: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FoodRequest {
  id: string;
  receiverId: string;
  initialTotalMeals: number;
  remainingTotalMeals: number;
  initialPureVegMeals: number;
  remainingPureVegMeals: number;
  neededBeforeAt: string;
  receivingAddress: string;
  receivingCity: string;
  receivingLatitude: number;
  receivingLongitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryService {
  id: string;
  volunteerId: string;
  status: 'assigned' | 'accepted' | 'active' | 'picked_up' | 'in_transit' | 'delivered' | 'declined' | 'cancelled' | 'failed';
  createdAt: string;
  endedAt: string | null;
}

export interface MockApiError {
  code: 'VALIDATION_ERROR' | 'AUTH_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'SESSION_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  field?: string;
}

export interface MockApiResponse<T> {
  data: T | null;
  error: MockApiError | null;
}

export interface DashboardSummary {
  todayDonatedMeals: number;
  todayRequestedMeals: number;
  todayVolunteerDeliveries: number;
  donatedMealsLast7Days: number;
  donatedMealsLast30Days: number;
  requestedMealsLast7Days: number;
  requestedMealsLast30Days: number;
  volunteerDeliveriesLast7Days: number;
  volunteerDeliveriesLast30Days: number;
  activeDonationsCount: number;
  activeRequestsCount: number;
  activeVolunteerService: DeliveryService | null;
  hasDonorProfile: boolean;
  hasReceiverProfile: boolean;
  hasVolunteerProfile: boolean;
}
