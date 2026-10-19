import { Request } from 'express';
import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  // Set by RolesGuard (id + role) once it authenticates the request.
  userId?: string;
  user?: AuthenticatedUser;
  apiKey?: { id: string; ownerId: string };
}
