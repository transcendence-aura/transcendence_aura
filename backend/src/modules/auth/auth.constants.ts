import { CookieOptions } from 'express';

// node -e "require('bcrypt').hash('user-placeholder', 10).then(console.log)"
export const DUMMY_HASH = '$2b$10$QPgvtEWqYrUM/WZ2Rj12BerfXGJy7xFsRlvdq1BTKr2AoCFMr4FAa';

export const ACCESS_COOKIE_NAME = '__Host-access_token';

const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/',
};

export function getAccessCookieOptions(maxAgeMs: number): CookieOptions {
  return {
    ...ACCESS_COOKIE_OPTIONS,
    maxAge: maxAgeMs,
  };
}

export function getAccessCookieClearOptions(): CookieOptions {
  return ACCESS_COOKIE_OPTIONS;
}
