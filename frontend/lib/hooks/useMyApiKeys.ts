'use client';

import { useCallback, useEffect, useState } from 'react';
import { listMyApiKeys, type ApiKey } from '@/lib/api-keys/api-keys';

export function useMyApiKeys() {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [hasError, setHasError] = useState(false);

  // Resolves once the request is over, whatever the outcome (the error is in `hasError`).
  const refetch = useCallback(async () => {
    try {
      setKeys(await listMyApiKeys());
      setHasError(false);
    } catch {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return { keys, isLoading: keys === null && !hasError, hasError, refetch };
}
