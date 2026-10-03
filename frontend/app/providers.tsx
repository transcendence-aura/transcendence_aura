'use client';

import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo-client';
import { ToastProvider } from '@/components/ui/feedback/toast';
import { CartProvider } from '@/lib/hooks/useCart';
import { AuthProvider } from '@/lib/auth/auth-provider';
import { RealtimeProvider } from '@/lib/realtime/realtime-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <AuthProvider>
        <RealtimeProvider>
          <CartProvider>
            <ToastProvider>{children}</ToastProvider>
          </CartProvider>
        </RealtimeProvider>
      </AuthProvider>
    </ApolloProvider>
  );
}
