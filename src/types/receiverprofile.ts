// Auto-generated from prisma/schema.prisma — canonical ReceiverProfile shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export const RECEIVERORGANIZATIONTYPE_VALUES = ['ngo', 'shelter', 'community_kitchen', 'other'] as const;
export type ReceiverOrganizationType = 'ngo' | 'shelter' | 'community_kitchen' | 'other';
export type ReceiverOrganizationTypeValue = ReceiverOrganizationType;

export interface ReceiverProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  organizationName: string;
  organizationType: ReceiverOrganizationType;
  contactEmail: string;
  addressLine: string;
  city: string;
  latitude: string;
  longitude: string;
}
