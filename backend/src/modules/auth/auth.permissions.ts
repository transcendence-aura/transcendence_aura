import { UserRole } from '@prisma/client';

export const PERMISSIONS: Record<UserRole, readonly string[]> = {
  USER: [
    'profile:read',
    'profile:update',
    'wishlist:read',
    'wishlist:write',
    'collections:read',
    'collections:write',
    'products:read',
    'users:follow',
    'chat:read',
    'chat:send',
  ],

  ADMIN: [
    'profile:read',
    'profile:update',
    'wishlist:read',
    'wishlist:write',
    'collections:read',
    'collections:write',
    'products:read',
    'products:manage',
    'users:follow',
    'users:manage',
    'chat:read',
    'chat:send',
  ],
};

export function getPermissionsForRole(role: UserRole): string[] {
  return [...PERMISSIONS[role]];
}
