import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  // Set by GqlAuthGuard (id only) or by RolesGuard (id + role). RolesGuard
  // trusts a pre-existing userId instead of re-verifying the token.
  userId?: string;
  user?: AuthenticatedUser;
  apiKey?: { id: string; ownerId: string };
}
