'use client';

import { useSyncExternalStore } from 'react';

// Avatar URLs are stable per user id, so a component that stays mounted across
// an upload (the navbar) never sees its <img> src change and never refetches.
// This tracks the latest upload's timestamp so that component can append it as
// a cache-busting query param.
let version: string | null = null;
const listeners = new Set<() => void>();

export function setAvatarVersion(updatedAt: string): void {
  version = updatedAt;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAvatarVersion(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => version,
    () => null,
  );
}
