'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useQuery } from '@apollo/client/react';
// import { useRouter } from 'next/navigation'; // TODO: Uncomment once auth is functionnal
import { GET_WISHLIST } from '@/lib/graphql/queries/wishlist';
import { WishlistGrid, type WishlistProduct } from '@/components/wishlist/WishlistGrid';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';

interface WishlistQueryResponse {
  wishlist: WishlistProduct[];
}

export default function WishlistPage() {
  const t = useTranslations('Wishlist');
  // TODO: Uncomment useRouter and useEffect once /login route and auth are implemented
  // const router = useRouter();

  // TODO: Replace simulated auth flags with useQuery(GET_CURRENT_USER) once backend user auth is integrated
  const isAuthenticated = true;
  const userLoading = false;

  /*
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [userLoading, isAuthenticated, router]);
  */

  const { data, loading, error, refetch } = useQuery<WishlistQueryResponse>(GET_WISHLIST, {
    skip: !isAuthenticated,
  });

  if (userLoading || loading) {
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
