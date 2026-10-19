import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';

// Marks a handler/resolver as restricted to the given roles.
// Read by RolesGuard via Reflector - never checked by hand in the handler body.
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
