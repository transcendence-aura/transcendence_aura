'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery, useApolloClient } from '@apollo/client/react';
import { Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { Input } from '@/components/ui/form/input';
import { ProductCard } from '@/components/admin/products/ProductCard';
import {
  ProductFilterPills,
  type ProductCategoryFilter,
} from '@/components/admin/products/ProductFilterPills';
import { ProductFormDialog } from '@/components/admin/products/ProductFormDialog';
import {
  GET_ADMIN_PRODUCTS,
  GET_ADMIN_CATEGORIES,
  GET_ADMIN_PRODUCT_FAMILIES,
  GET_ADMIN_COLLECTIONS,
  GET_PUBLISHED_PRODUCTS_COUNT,
  type AdminProduct,
  type AdminProductsQueryResponse,
  type AdminCategoriesQueryResponse,
  type AdminProductFamiliesQueryResponse,
  type AdminCollectionsQueryResponse,
  type PublishedProductsCountResponse,
} from '@/lib/graphql/queries/admin-products';

const PAGE_SIZE = 20;

export default function AdminProductsPage() {
  const client = useApolloClient();
  const [categoryFilter, setCategoryFilter] = useState<ProductCategoryFilter>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState<{ open: boolean; product: AdminProduct | null }>({
    open: false,
    product: null,
  });
  // Bumped on every open so ProductFormDialog remounts fresh instead of
  // resetting its state via an effect (avoids stale state leaking between
  // two separate "create" sessions opened back to back).
  const [formKey, setFormKey] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [allProductsTotal, setAllProductsTotal] = useState(0);
  const [publishedTotal, setPublishedTotal] = useState(0);

  const { data: categoriesData } = useQuery<AdminCategoriesQueryResponse>(GET_ADMIN_CATEGORIES);
  const categories = useMemo(() => categoriesData?.adminCategories ?? [], [categoriesData]);

  const { data: productFamiliesData } = useQuery<AdminProductFamiliesQueryResponse>(
    GET_ADMIN_PRODUCT_FAMILIES,
  );
  const productFamilies = useMemo(
    () => productFamiliesData?.adminProductFamilies ?? [],
    [productFamiliesData],
  );

  const { data: collectionsData } = useQuery<AdminCollectionsQueryResponse>(GET_ADMIN_COLLECTIONS);
  const collections = useMemo(() => collectionsData?.adminCollections ?? [], [collectionsData]);

  // Pill counts: one lightweight products() call for "All" plus one per
  // category. These are separate imperative client.query() calls (not
  // useQuery), so they aren't touched by the main list's refetchQueries —
  // they must be refreshed explicitly whenever the product set changes
  // (category/list load, or a create/update/delete/publish mutation below).
  const refreshCounts = useCallback(() => {
    client
      .query<PublishedProductsCountResponse>({
        query: GET_PUBLISHED_PRODUCTS_COUNT,
        fetchPolicy: 'network-only',
      })
      .then((result) => setPublishedTotal(result.data?.products.total ?? 0));

    if (categories.length === 0) return;

    Promise.all([
      client.query<AdminProductsQueryResponse>({
        query: GET_ADMIN_PRODUCTS,
        variables: { pagination: { page: 1, limit: 1 } },
        fetchPolicy: 'network-only',
      }),
      ...categories.map((category) =>
        client.query<AdminProductsQueryResponse>({
          query: GET_ADMIN_PRODUCTS,
          variables: {
            filter: { categorySlug: category.slug },
            pagination: { page: 1, limit: 1 },
          },
          fetchPolicy: 'network-only',
        }),
      ),
    ]).then(([allResult, ...categoryResults]) => {
      setAllProductsTotal(allResult.data?.adminProducts.total ?? 0);
      setCategoryCounts(
        Object.fromEntries(
          categoryResults.map(
            (result, i) => [categories[i].slug, result.data?.adminProducts.total ?? 0] as const,
          ),
        ),
      );
    });
  }, [categories, client]);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  const { data, loading, error, refetch } = useQuery<AdminProductsQueryResponse>(
    GET_ADMIN_PRODUCTS,
    {
      variables: {
        filter: {
          ...(categoryFilter !== 'ALL' ? { categorySlug: categoryFilter } : {}),
          ...(search.trim() ? { search: search.trim() } : {}),
        },
        pagination: { page, limit: PAGE_SIZE },
      },
    },
  );

  useEffect(() => {
    if (data) refreshCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const handleCategoryChange = (value: ProductCategoryFilter) => {
    setCategoryFilter(value);
    setPage(1);
  };

  const products = data?.adminProducts.items ?? [];
  const total = data?.adminProducts.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-ui-label text-text-muted uppercase tracking-widest">
            Product Catalogue
          </p>
          <h1 className="text-h2 font-bold">Products</h1>
          <p className="text-body-sm text-text-muted mt-1">
            {publishedTotal.toLocaleString()} active products
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="text-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-64 pl-10"
            />
          </div>
          <Button
            onClick={() => {
              setFormState({ open: true, product: null });
              setFormKey((k) => k + 1);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      <ProductFilterPills
        value={categoryFilter}
        onChange={handleCategoryChange}
        categories={categories}
        totalCount={allProductsTotal}
        countsBySlug={categoryCounts}
      />

      {loading ? (
        <ProductsGridSkeleton />
      ) : error ? (
        <div className="border-border-default bg-card border py-16 text-center">
          <p className="text-body-base text-text-muted mb-6">Failed to load products</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      ) : products.length === 0 ? (
        <div className="border-border-default bg-card border py-16 text-center">
          <p className="text-body-base text-text-muted">No products found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => {
                  setFormState({ open: true, product });
                  setFormKey((k) => k + 1);
                }}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-text-muted">
                Showing {products.length} of {total.toLocaleString()} products
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-border-default hover:border-border-focus flex h-8 w-8 items-center justify-center border text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Previous page"
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`flex h-8 w-8 items-center justify-center border text-body-sm transition-colors ${
                      page === p
                        ? 'bg-brand-dark border-brand-dark text-text-inverse'
                        : 'border-border-default hover:border-border-focus'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="border-border-default hover:border-border-focus flex h-8 w-8 items-center justify-center border text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <ProductFormDialog
        key={formKey}
        isOpen={formState.open}
        product={formState.product}
        categories={categories}
        productFamilies={productFamilies}
        collections={collections}
        onClose={() => setFormState({ open: false, product: null })}
      />
    </div>
  );
}

function ProductsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  );
}
