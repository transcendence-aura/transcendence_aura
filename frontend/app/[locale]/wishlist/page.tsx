'use client';

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
        <h1 className="text-h2 font-bold mb-8">My Wishlist</h1>
        <div className="text-center py-12">
          <p className="text-body-base text-text-muted mb-6">Failed to load wishlist</p>
          <Button onClick={() => refetch()} className="px-6 py-3">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const products = data?.wishlist || [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <h1 className="text-h2 font-bold mb-8">My Wishlist</h1>

      {products.length === 0 ? <EmptyWishlist /> : <WishlistGrid products={products} />}
    </div>
  );
}

function WishlistSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <h1 className="text-h2 font-bold mb-8">My Wishlist</h1>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function EmptyWishlist() {
  return (
    <div className="text-center py-20">
      <p className="text-body-base text-text-muted mb-6">Your wishlist is empty</p>
      <Link
        href="/catalogue"
        className="inline-block px-6 py-3 bg-brand-dark text-text-inverse rounded uppercase text-xs font-medium hover:bg-brand-darker transition-colors"
      >
        Continue Shopping
      </Link>
    </div>
  );
}
