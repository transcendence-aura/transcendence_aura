'use client';

import { useSyncExternalStore } from 'react';
import { getAccessToken, subscribeToAccessToken } from '@/lib/auth/token-store';

export type CurrentUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  permissions: string[];
} | null;

interface JwtClaims {
  sub?: string;
  firstName?: string;
  lastName?: string;
  permissions?: string[];
}

function parseTokenClaims(token: string | null): JwtClaims | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(''),
    );
    return JSON.parse(jsonPayload) as JwtClaims;
  } catch {
    return null;
  }
}

function getCurrentUserSnapshot(): CurrentUser {
  const token = getAccessToken();
  if (!token) return null;

  const payload = parseTokenClaims(token);
  if (!payload || !payload.sub) return null;

  return {
    id: payload.sub,
    firstName: payload.firstName,
    lastName: payload.lastName,
    permissions: Array.isArray(payload.permissions) ? payload.permissions : [],
  };
}

let cachedUser: CurrentUser = null;
let lastToken: string | null = null;

function getSnapshot(): CurrentUser {
  const currentToken = getAccessToken();
  if (currentToken !== lastToken) {
    lastToken = currentToken;
    cachedUser = getCurrentUserSnapshot();
  }
  return cachedUser;
}

export function useCurrentUser(): { user: CurrentUser; isAuthenticated: boolean } {
  const user = useSyncExternalStore(subscribeToAccessToken, getSnapshot, () => null);

  return {
    user,
    isAuthenticated: user !== null,
  };
}
