'use client';

import { useEffect, useState } from 'react';

// Delays reacting to a fast-changing value (typing) until it settles, so callers relying on it -
// a GraphQL filter variable, say - don't fire a request on every keystroke.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
