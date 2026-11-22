import { delay, fail, ok } from './mockDelay';
import { getStorageValue, setStorageValue } from './mockStorage';
import { supabase } from '@/lib/supabase';
import type { Donation, FoodRequest, DeliveryService, MockApiResponse } from './types';

const DONATIONS_KEY = 'foodpulse_mock_donations';
const FOOD_REQUESTS_KEY = 'foodpulse_mock_food_requests';
const DELIVERY_SERVICES_KEY = 'foodpulse_mock_delivery_services';

export interface AllocationResult {
  donationId: string;
  requestId: string;
  vegForPureVeg: number; // V_P
  nonVegForFlex: number; // N_F
  vegForFlex: number; // V_F
  totalAllocated: number; // A
  matchType: 'full' | 'partial';
}

async function getActiveDonations(): Promise<Donation[]> {
  const now = Date.now();
  try {
    const { data, error } = await supabase.from('donations').select('*');
    if (!error && data && data.length > 0) {
      const active = data
        .map((row: Record<string, unknown>) => ({
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
        }))
        .filter((d: Donation) => {
          const bb = Date.parse(d.bestBeforeAt);
          const au = Date.parse(d.availableUntilAt);
          return (
            !Number.isNaN(bb) &&
            bb > now &&
            !Number.isNaN(au) &&
            au > now &&
            d.remainingVegMeals + d.remainingNonVegMeals > 0
          );
        });
      if (active.length > 0) return active;
    }
  } catch {}

  return getStorageValue<Donation[]>(DONATIONS_KEY, []).filter((d) => {
    const bb = Date.parse(d.bestBeforeAt);
    const au = Date.parse(d.availableUntilAt);
    return (
      !Number.isNaN(bb) &&
      bb > now &&
      !Number.isNaN(au) &&
      au > now &&
      d.remainingVegMeals + d.remainingNonVegMeals > 0
    );
  });
}

async function getActiveRequests(): Promise<FoodRequest[]> {
  const now = Date.now();
  try {
    const { data, error } = await supabase.from('food_requests').select('*');
    if (!error && data && data.length > 0) {
      const active = data
        .map((row: Record<string, unknown>) => ({
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
        }))
        .filter((r: FoodRequest) => {
          const nb = Date.parse(r.neededBeforeAt);
          return !Number.isNaN(nb) && nb > now && r.remainingTotalMeals > 0;
        });
      if (active.length > 0) return active;
    }
  } catch {}

  return getStorageValue<FoodRequest[]>(FOOD_REQUESTS_KEY, []).filter((r) => {
    const nb = Date.parse(r.neededBeforeAt);
    return !Number.isNaN(nb) && nb > now && r.remainingTotalMeals > 0;
  });
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Executes a matching cycle following PRD §12:
 * 1. Active filtering for donations and requests
 * 2. Compatible pairing:
 *    (remaining_veg_meals > 0 AND remaining_total_meals > 0) OR
 *    (remaining_non_veg_meals > 0 AND flexible_demand > 0)
 * 3. Priority sort: needed_before_at ASC, distance ASC, best_before_at ASC, donation_id ASC, food_request_id ASC
 * 4. Provisional allocation formula:
 *    V_P = min(Veg_D, PureVeg_R)
 *    N_F = min(NonVeg_D, Flexible_R)
 *    V_F = min(Veg_D - V_P, Flexible_R - N_F)
 *    A   = V_P + N_F + V_F
 */
export async function runMatchingCycle(): Promise<MockApiResponse<AllocationResult[]>> {
  await delay();

  const donations = await getActiveDonations();
  const requests = await getActiveRequests();
  const results: AllocationResult[] = [];

  const pairs: { donation: Donation; request: FoodRequest; distance: number }[] = [];
  for (const d of donations) {
    for (const r of requests) {
      const flexR = r.remainingTotalMeals - r.remainingPureVegMeals;
      const compatible =
        (d.remainingVegMeals > 0 && r.remainingTotalMeals > 0) ||
        (d.remainingNonVegMeals > 0 && flexR > 0);

      if (compatible) {
        const dist = haversineDistance(
          d.pickupLatitude,
          d.pickupLongitude,
          r.receivingLatitude,
          r.receivingLongitude,
        );
        pairs.push({ donation: d, request: r, distance: dist });
      }
    }
  }

  // PRD §12.2 Priority ordering
  pairs.sort((a, b) => {
    const nbA = Date.parse(a.request.neededBeforeAt);
    const nbB = Date.parse(b.request.neededBeforeAt);
    if (nbA !== nbB) return nbA - nbB;
    if (a.distance !== b.distance) return a.distance - b.distance;
    const bbA = Date.parse(a.donation.bestBeforeAt);
    const bbB = Date.parse(b.donation.bestBeforeAt);
    if (bbA !== bbB) return bbA - bbB;
    if (a.donation.id !== b.donation.id) return a.donation.id < b.donation.id ? -1 : 1;
    return a.request.id < b.request.id ? -1 : 1;
  });

  // Working balances map to prevent over-allocation during single cycle
  const donBal = new Map(
    donations.map((d) => [
      d.id,
      { veg: d.remainingVegMeals, nonVeg: d.remainingNonVegMeals },
    ]),
  );
  const reqBal = new Map(
    requests.map((r) => [
      r.id,
      { total: r.remainingTotalMeals, pureVeg: r.remainingPureVegMeals },
    ]),
  );

  for (const pair of pairs) {
    const db = donBal.get(pair.donation.id);
    const rb = reqBal.get(pair.request.id);
    if (!db || !rb || db.veg + db.nonVeg <= 0 || rb.total <= 0) continue;

    const flexR = rb.total - rb.pureVeg;
    const vP = Math.min(db.veg, rb.pureVeg);
    const nF = Math.min(db.nonVeg, flexR);
    const vF = Math.min(db.veg - vP, Math.max(flexR - nF, 0));
    const A = vP + nF + vF;

    if (A <= 0) continue;

    // Deduct working balances
    db.veg -= vP + vF;
    db.nonVeg -= nF;
    rb.pureVeg -= vP;
    rb.total -= A;

    results.push({
      donationId: pair.donation.id,
      requestId: pair.request.id,
      vegForPureVeg: vP,
      nonVegForFlex: nF,
      vegForFlex: vF,
      totalAllocated: A,
      matchType: A >= rb.total + A ? 'full' : 'partial',
    });
  }

  return ok(results);
}

function findAssignedService(
  services: DeliveryService[],
  userId: string,
  serviceId: string,
): DeliveryService | undefined {
  return services.find(
    (s) => s.id === serviceId && s.volunteerId === userId && s.status === 'assigned',
  );
}

export async function acceptMockAssignment(
  userId: string,
  serviceId: string,
): Promise<MockApiResponse<DeliveryService>> {
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('accept_FoodPulse_delivery_service', {
      p_service_id: serviceId,
    });
    if (!rpcErr && rpcData) {
      return ok({
        id: serviceId,
        volunteerId: userId,
        status: 'accepted',
        createdAt: new Date().toISOString(),
        endedAt: null,
      });
    }
  } catch {
    // Fall back to local mock
  }

  await delay();
  const services = getStorageValue<DeliveryService[]>(DELIVERY_SERVICES_KEY, []);
  const record = findAssignedService(services, userId, serviceId);
  if (!record) {
    return fail('NOT_FOUND', 'Assignment not found.');
  }

  const updated: DeliveryService = { ...record, status: 'accepted' };
  setStorageValue(
    DELIVERY_SERVICES_KEY,
    services.map((s) => (s === record ? updated : s)),
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
  setStorageValue(
    DELIVERY_SERVICES_KEY,
    services.map((s) => (s === record ? updated : s)),
  );
  return ok(updated);
}

export async function getActiveMatches(userId: string): Promise<MockApiResponse<AllocationResult[]>> {
  await delay();
  void userId;
  const cycle = await runMatchingCycle();
  return cycle;
}

export async function getMockVolunteerService(
  userId: string,
): Promise<MockApiResponse<DeliveryService | null>> {
  await delay();
  const { getVolunteerService } = await import('./mockVolunteerApi');
  return getVolunteerService(userId);
}
