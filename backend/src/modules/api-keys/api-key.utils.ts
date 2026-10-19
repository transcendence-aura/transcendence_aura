import { createHash, randomBytes } from 'node:crypto';

const API_KEY_PREFIX = 'sk_live_';

export function generateApiKey(): string {
  return API_KEY_PREFIX + randomBytes(32).toString('base64url');
}

export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey, 'utf8').digest('hex');
}
