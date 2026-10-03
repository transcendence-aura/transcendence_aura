let accessToken: string | null = null;
let signedOutByUser = false;
const listeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  signedOutByUser = false;
  if (accessToken === token) return;
  accessToken = token;
  notifyListeners();
}

// `byUser`: the user chose to sign out (as opposed to a session that expired or was revoked).
export function clearAccessToken({ byUser = false }: { byUser?: boolean } = {}): void {
  if (accessToken === null) return;
  accessToken = null;
  signedOutByUser = byUser;
  notifyListeners();
}

export function wasSignedOutByUser(): boolean {
  return signedOutByUser;
}

// For useSyncExternalStore — lets components react to login/logout without
// a page reload, since the token itself lives outside React state.
export function subscribeToAccessToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}
