'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@apollo/client/react';
import { ProductCard } from '@/components/cards/ProductCard';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { PRODUCTS_QUERY, type ProductsQueryResponse } from '@/lib/graphql/queries/products';
import { toSearchQuery } from '@/lib/search/to-search-query';

const RESULTS_PER_PAGE = 12;
const SKELETON_COUNT = 6;

// Mount with key={term} so the page resets to 1 on each new search.
export function SearchResults({ term }: { term: string }) {
  const [page, setPage] = useState(1);

  // null when the term has nothing searchable: no request, straight to the empty state.
  const searchQuery = toSearchQuery(term);

  const { data, loading, error, refetch } = useQuery<ProductsQueryResponse>(PRODUCTS_QUERY, {
    skip: searchQuery === null,
    variables: { filter: { search: searchQuery }, pagination: { page, limit: RESULTS_PER_PAGE } },
  });

  const products = data?.products.items ?? [];
  const total = data?.products.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / RESULTS_PER_PAGE));

  return (
    <div className="bg-page min-h-screen">
      <div className="border-border-default bg-page border-b px-4 py-5 sm:px-6 md:px-8 md:py-7">
        <p className="text-ui-label text-text-muted mb-2">Search results</p>
        <h1 className="font-cormorant text-display-title text-text-primary mb-1 font-bold break-words">
          &ldquo;{term}&rdquo;
        </h1>
        <p className="text-body-sm text-text-muted">
          {loading ? 'Searching...' : `${total} ${total === 1 ? 'result' : 'results'}`}
        </p>
      </div>

      <div className="p-4 sm:p-5 md:p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <div key={index} className="flex flex-col gap-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-body-base text-text-muted">Failed to load search results</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="font-cormorant text-display-subtitle text-text-primary">
              No results for &ldquo;{term}&rdquo;
            </p>
            <p className="text-body-base text-text-muted">
              Check the spelling or try a more general term.
            </p>
            <Link
              href="/catalogue"
              className="text-ui-button border-border-default text-text-primary hover:bg-page border px-6 py-3 uppercase transition-colors"
            >
              Back to the catalogue
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <span className="text-body-sm text-text-muted">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
