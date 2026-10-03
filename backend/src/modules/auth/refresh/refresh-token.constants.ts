import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = '__Host-refresh_token';

const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
};

export function getRefreshCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    ...REFRESH_COOKIE_OPTIONS,
    maxAge: maxAgeMs,
  };
}

export function getRefreshCookieClearOptions(): CookieOptions {
  return REFRESH_COOKIE_OPTIONS;
}
