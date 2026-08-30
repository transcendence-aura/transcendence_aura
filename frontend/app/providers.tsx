'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/feedback/toast';

export function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
