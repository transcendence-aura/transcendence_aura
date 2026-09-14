// The access token carries `permissions`, not a `role` claim directly (see
// backend/src/modules/auth/auth.permissions.ts) — ADMIN is the only role
// that has `users:manage`, so that's the signal used here.
const ADMIN_PERMISSION = 'users:manage';

interface DecodedAccessToken {
  sub: string;
  permissions: string[];
}

// Decodes the token's payload only — never verifies the signature. This is
// intentionally lightweight: the frontend gate is UX only, the backend
// (RolesGuard) is what actually re-checks the caller on every request. A
// forged or stale token here can at most produce a wrong UI decision, never
// a data leak.
function decodeAccessToken(token: string): DecodedAccessToken | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded: unknown = JSON.parse(atob(padded));

    if (
      typeof decoded !== 'object' ||
      decoded === null ||
      typeof (decoded as { sub?: unknown }).sub !== 'string' ||
      !Array.isArray((decoded as { permissions?: unknown }).permissions)
    ) {
      return null;
    }

    return decoded as DecodedAccessToken;
  } catch {
    return null;
  }
}

export function hasAdminPermission(token: string | null | undefined): boolean {
  if (!token) return false;
  return decodeAccessToken(token)?.permissions.includes(ADMIN_PERMISSION) ?? false;
}
