let accessToken: string | null = null;
const listeners = new Set<() => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
  notifyListeners();
}

export function clearAccessToken(): void {
  accessToken = null;
  notifyListeners();
}

// For useSyncExternalStore — lets components react to login/logout without
// a page reload, since the token itself lives outside React state.
export function subscribeToAccessToken(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(): void {
  listeners.forEach((listener) => listener());
}
