// Auto-generated from prisma/schema.prisma — canonical FoodRequest shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface FoodRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  receiverId: string;
  initialTotalMeals: number;
  remainingTotalMeals: number;
  initialPureVegMeals: number;
  remainingPureVegMeals: number;
  neededBeforeAt: string;
  receivingAddress: string;
  receivingCity: string;
  receivingLatitude: string;
  receivingLongitude: string;
}
