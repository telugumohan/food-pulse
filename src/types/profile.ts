// Auto-generated from prisma/schema.prisma — canonical Profile shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export const ROLE_VALUES = ['user', 'admin'] as const;
export type Role = 'user' | 'admin';
export type RoleValue = Role;

export interface Profile {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  city: string;
  latitude: string;
  longitude: string;
  role: Role;
}
