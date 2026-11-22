// Auto-generated from prisma/schema.prisma — canonical Donation shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface Donation {
  id: string;
  createdAt: string;
  updatedAt: string;
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
  pickupLatitude: string;
  pickupLongitude: string;
  storageHandlingInformation: string;
  allergenInformation?: string | null;
  allergensUnknown: boolean;
}
