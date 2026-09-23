'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useQuery } from '@apollo/client/react';
import { GET_WISHLIST } from '@/lib/graphql/queries/wishlist';
import { WishlistGrid, type WishlistProduct } from '@/components/wishlist/WishlistGrid';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';

interface WishlistQueryResponse {
  wishlist: WishlistProduct[];
}

export default function WishlistPage() {
  const t = useTranslations('Wishlist');
  // The proxy already redirects to /login before this page ever renders without a session
  // (`wishlist` is in PROTECTED_SEGMENTS) - this only decides whether to skip the query while the
  // client's own auth state is still catching up.
  const isAuthenticated = useIsAuthenticated();

  const { data, loading, error, refetch } = useQuery<WishlistQueryResponse>(GET_WISHLIST, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated || loading) {
    return <WishlistSkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
        <h1 className="text-h2 font-bold mb-8">{t('title')}</h1>
        <div className="text-center py-12">
          <p className="text-body-base text-text-muted mb-6">{t('loadFailed')}</p>
          <Button onClick={() => refetch()} className="px-6 py-3">
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  const products = data?.wishlist || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <h1 className="text-h2 font-bold mb-8">{t('title')}</h1>

      {products.length === 0 ? <EmptyWishlist /> : <WishlistGrid products={products} />}
    </div>
  );
}

function WishlistSkeleton() {
  const t = useTranslations('Wishlist');

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <h1 className="text-h2 font-bold mb-8">{t('title')}</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyWishlist() {
  const t = useTranslations('Wishlist');

  return (
    <div className="text-center py-20">
      <p className="text-body-base text-text-muted mb-6">{t('empty')}</p>
      <Link
        href="/catalogue"
        className="inline-block px-6 py-3 bg-brand-dark text-text-inverse rounded uppercase text-ui-label font-medium hover:bg-brand-darker transition-colors"
      >
        {t('continueShopping')}
      </Link>
    </div>
  );
}
