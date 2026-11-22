// Auto-generated from prisma/schema.prisma — canonical DeliveryService shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export const DELIVERYSERVICESTATUS_VALUES = ['assigned', 'accepted', 'active', 'picked_up', 'in_transit', 'delivered', 'declined', 'cancelled', 'failed'] as const;
export type DeliveryServiceStatus = 'assigned' | 'accepted' | 'active' | 'picked_up' | 'in_transit' | 'delivered' | 'declined' | 'cancelled' | 'failed';
export type DeliveryServiceStatusValue = DeliveryServiceStatus;

export interface DeliveryService {
  id: string;
  createdAt: string;
  updatedAt: string;
  volunteerId: string;
  status: DeliveryServiceStatus;
  endedAt?: string | null;
}
