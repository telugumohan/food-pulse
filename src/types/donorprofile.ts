// Auto-generated from prisma/schema.prisma — canonical DonorProfile shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export const DONORORGANIZATIONTYPE_VALUES = ['restaurant', 'caterer', 'hostel_mess', 'canteen', 'event_organizer'] as const;
export type DonorOrganizationType = 'restaurant' | 'caterer' | 'hostel_mess' | 'canteen' | 'event_organizer';
export type DonorOrganizationTypeValue = DonorOrganizationType;

export interface DonorProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationName: string;
  organizationType: DonorOrganizationType;
  addressLine: string;
  city: string;
  latitude: string;
  longitude: string;
}
