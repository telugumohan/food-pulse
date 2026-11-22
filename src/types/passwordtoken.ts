// Auto-generated from prisma/schema.prisma — canonical PasswordToken shape.
// The API serializes these exact field names; UI components read them.
// Do not hand-edit — regenerate from the schema instead.

export interface PasswordToken {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  token: string;
  invalidatedAt?: string | null;
  usedAt?: string | null;
}
