// Auto-generated from prisma/schema.prisma — canonical User shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export const ROLE_VALUES = ['user', 'admin'] as const;
export type Role = 'user' | 'admin';
export type RoleValue = Role;

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  email: string;
  emailConfirmed: boolean;
  role: Role;
  fullName?: string | null;
}
