'use client';

import { useSyncExternalStore } from 'react';
import { getAccessToken, subscribeToAccessToken } from './token-store';

// Check if the user is signed in.
// Updates on login/logout without reload. UI only, backend still guards auth.
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(
    subscribeToAccessToken,
    () => getAccessToken() !== null,
    () => false, // server snapshot: no client token during SSR
  );
}
