import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = '__Host-refresh_token';

export function getRefreshCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
    maxAge: maxAgeMs,
  };
}
