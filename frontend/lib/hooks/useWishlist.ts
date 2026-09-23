'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useToast } from '@/components/ui/feedback/toast';
import {
  ADD_TO_WISHLIST,
  GET_WISHLIST,
  REMOVE_FROM_WISHLIST,
} from '@/lib/graphql/queries/wishlist';

interface WishlistQueryResponse {
  wishlist: { id: string }[];
}

// Shared by every place that renders the wishlist heart (catalogue, search results, the product
// page) so they all read and update the same state instead of each keeping their own.
export function useWishlist() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const t = useTranslations('Wishlist');

  const { data } = useQuery<WishlistQueryResponse>(GET_WISHLIST, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  // addWishlistItem only returns { id, productId } - not enough to update the cached product list
  // by hand, so both mutations just refetch it instead of hand-rolling a cache patch. Awaited so
  // the optimistic overlay below only clears once the refetched list actually confirms the change.
  const [addWishlistItem] = useMutation(ADD_TO_WISHLIST, {
    refetchQueries: [{ query: GET_WISHLIST }],
    awaitRefetchQueries: true,
  });
  const [removeWishlistItem] = useMutation(REMOVE_FROM_WISHLIST, {
    refetchQueries: [{ query: GET_WISHLIST }],
    awaitRefetchQueries: true,
  });

  const serverIds = new Set((data?.wishlist ?? []).map((product) => product.id));

  // Toggled ids not yet confirmed by the server - read first so the heart (and the navbar count)
  // update the instant something is clicked, instead of waiting on the round trip.
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const currentIds = new Set(serverIds);
  for (const [productId, isAdded] of Object.entries(pending)) {
    if (isAdded) currentIds.add(productId);
    else currentIds.delete(productId);
  }

  const isInWishlist = (productId: string): boolean => currentIds.has(productId);
  const itemCount = currentIds.size;

  const toggle = async (productId: string): Promise<void> => {
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    const wasInWishlist = isInWishlist(productId);
    setPending((prev) => ({ ...prev, [productId]: !wasInWishlist }));

    try {
      if (wasInWishlist) {
        await removeWishlistItem({ variables: { input: { productId } } });
        toast({ message: t('removed'), variant: 'success' });
      } else {
        await addWishlistItem({ variables: { input: { productId } } });
        toast({ message: t('added'), variant: 'success' });
      }
    } catch {
      toast({ message: wasInWishlist ? t('removeFailed') : t('addFailed'), variant: 'error' });
    } finally {
      setPending((prev) => {
        if (!(productId in prev)) return prev;
        const next = { ...prev };
        delete next[productId];
        return next;
      });
    }
  };

  return { isInWishlist, toggle, itemCount };
}
