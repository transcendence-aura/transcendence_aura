'use client';

import { useEffect, useState } from 'react';
import { refreshAccessToken } from './refresh-access-token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    refreshAccessToken().finally(() => {
      setInitialized(true);
    });
  }, []);

  if (!initialized) {
    return null;
  }

  return children;
}
