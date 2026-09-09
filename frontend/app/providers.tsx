'use client';

import { ReactNode } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo-client';
import { ToastProvider } from '@/components/ui/feedback/toast';
import { CartProvider } from '@/lib/hooks/useCart';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ApolloProvider client={apolloClient}>
      <CartProvider>
        <ToastProvider>{children}</ToastProvider>
      </CartProvider>
    </ApolloProvider>
  );
}
