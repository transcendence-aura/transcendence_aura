'use client';

import { useQuery } from '@apollo/client/react';
import type { AnalyticsPeriod } from '@/lib/graphql/queries/admin-dashboard';
import {
  GET_TOP_PRODUCTS_BY_WISHLIST_ADDS,
  type TopProductsByWishlistAddsResponse,
} from '@/lib/graphql/queries/admin-analytics';
import { DashboardListCard } from './DashboardListCard';

const TOP_PRODUCTS_COUNT = 3;

// The design ranks products by revenue, which has no backend source yet, so
// the ranking and the figure shown are wishlist adds.
export function TopProductsCard({ period }: { period: AnalyticsPeriod }) {
  const { data, loading, error, refetch } = useQuery<TopProductsByWishlistAddsResponse>(
    GET_TOP_PRODUCTS_BY_WISHLIST_ADDS,
    { variables: { period, limit: TOP_PRODUCTS_COUNT } },
  );

  const products = data?.topProductsByWishlistAdds ?? [];
  const maxAdds = Math.max(...products.map((product) => product.wishlistAdds), 1);

  return (
    <DashboardListCard
      title="Top Products"
      actionLabel="View all"
      actionHref="/admin/products"
      loading={loading}
      error={Boolean(error)}
      isEmpty={products.length === 0}
      emptyMessage="No data yet"
      onRetry={() => refetch()}
    >
      <ol className="flex flex-col">
        {products.map((product, index) => (
          <li
            key={product.productId}
            className="border-border-default flex items-center gap-4 border-b py-3 last:border-b-0"
          >
            <span className="text-body-sm text-text-muted w-4">{index + 1}</span>
            <span className="text-body-base text-text-primary flex-1 font-medium">
              {product.name}
            </span>
            <div className="flex w-28 flex-col items-end gap-1">
              <span className="text-body-sm text-text-primary">
                {product.wishlistAdds} wishlist adds
              </span>
              <span
                className="bg-brand-dark block h-px"
                style={{ width: `${(product.wishlistAdds / maxAdds) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ol>
    </DashboardListCard>
  );
}
