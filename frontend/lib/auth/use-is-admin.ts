'use client';

import { useSyncExternalStore } from 'react';
import { getAccessToken, subscribeToAccessToken } from './token-store';
import { hasAdminPermission } from './decode-token';

// UX-only signal: reflects whatever the in-memory token currently claims,
// re-syncs automatically when the token changes (login/logout), no reload
// needed. Never the source of truth for access control — RolesGuard is.
export function useIsAdmin(): boolean {
  return useSyncExternalStore(
    subscribeToAccessToken,
    () => hasAdminPermission(getAccessToken()),
    () => false, // server snapshot: no client token during SSR, never admin
  );
}
