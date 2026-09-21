import { getAccessToken } from '@/lib/auth/token-store';
import { refreshAccessToken } from '@/lib/auth/refresh-access-token';

export interface ApiKey {
  id: string;
  name: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isRevoked: boolean;
  revokedAt: string | null;
  createdAt: string;
}

// The raw key is only in the response to the creation: it can never be fetched again.
export interface CreatedApiKey {
  id: string;
  name: string;
  key: string;
  expiresAt: string | null;
  createdAt: string;
}

// Keys of the `ApiKeys.errors` messages: the components translate them.
export type ApiKeyErrorCode =
  'sessionExpired' | 'alreadyActive' | 'notFound' | 'network' | 'failed';

export class ApiKeyError extends Error {
  constructor(readonly code: ApiKeyErrorCode) {
    super(code);
  }
}

function getErrorCode(status: number): ApiKeyErrorCode {
  if (status === 401) return 'sessionExpired';
  if (status === 409) return 'alreadyActive';
  if (status === 404) return 'notFound';
  return 'failed';
}

async function send(path: string, init: RequestInit, accessToken: string | null) {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  try {
    return await fetch(path, { ...init, headers });
  } catch {
    throw new ApiKeyError('network');
  }
}

// The access token lives 15 minutes: on a 401, refresh it once and send the request again.
async function request(path: string, init: RequestInit = {}): Promise<Response> {
  let response = await send(path, init, getAccessToken());

  if (response.status === 401) {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) response = await send(path, init, refreshedToken);
  }

  if (!response.ok) throw new ApiKeyError(getErrorCode(response.status));
  return response;
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new ApiKeyError('failed');
  }
}

export async function listMyApiKeys(): Promise<ApiKey[]> {
  return readJson<ApiKey[]>(await request('/api/keys/me'));
}

export async function createApiKey(name: string): Promise<CreatedApiKey> {
  const response = await request('/api/keys', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return readJson<CreatedApiKey>(response);
}

export async function revokeApiKey(id: string): Promise<void> {
  await request(`/api/keys/${encodeURIComponent(id)}/revoke`, { method: 'POST' });
}

// The backend allows one non-revoked key per account.
export function getActiveApiKey(keys: ApiKey[]): ApiKey | undefined {
  return keys.find((key) => !key.isRevoked);
}
