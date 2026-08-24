import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  // Only guaranteed once RolesGuard has run: an upstream authentication
  // guard may have attached just the id before RolesGuard resolves the role.
  role?: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
