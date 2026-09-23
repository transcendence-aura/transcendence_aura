'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { LayoutGrid, List, Heart } from 'lucide-react';
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar';
import { ProductCard } from '@/components/cards/ProductCard';
import { SearchResults } from '@/components/search/SearchResults';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { useCart } from '@/lib/hooks/useCart';
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue';
import { useToast } from '@/components/ui/feedback/toast';
import { isLocalMediaUrl } from '@/lib/media/image-url';
import { CATALOGUE_CATEGORIES } from '@/lib/catalogue/categories';
import { CATALOGUE_COLLECTIONS } from '@/lib/catalogue/collections';
import { CATALOGUE_PRODUCT_FAMILIES } from '@/lib/catalogue/product-families';
import {
  PRODUCTS_QUERY,
  type Product,
  type ProductsQueryResponse,
} from '@/lib/graphql/queries/products';

type SortOrder = 'featured' | 'price-asc' | 'price-desc';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 9;
// Well above every product currently in the catalogue (highest seed price: €84) - kept generous
// so the default range never hides a product by accident, while staying short enough to display
// cleanly in the price inputs.
const DEFAULT_PRICE_RANGE: [number, number] = [0, 500];

const SKELETON_COUNT = 9;

function CatalogueContent() {
  const t = useTranslations('Catalogue');
  const tFilters = useTranslations('CatalogueFilters');
  const tBadges = useTranslations('ProductBadges');
  const format = useFormatter();
  const { addItem } = useCart();
  const { toast } = useToast();
  const searchTerm = useSearchParams().get('q')?.trim() ?? '';

  // The sidebar's own search box (distinct from `searchTerm` above, the navbar's search which
  // swaps this whole view for SearchResults): it stays on this page and combines with the other
  // filters. Debounced so typing doesn't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300).trim();

  const [priceRange, setPriceRange] = useState<[number, number]>(DEFAULT_PRICE_RANGE);
  const [sortBy, setSortBy] = useState<SortOrder>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined')
      return (sessionStorage.getItem('catalogue_view') as ViewMode) || 'grid';

    return 'grid';
  });
  // null: no filter ("All"). The backend only accepts one collectionSlug/categorySlug/
  // productFamilySlug at a time each, but the three combine together (a product must match all
  // of them when several are set).
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  // Client-side only for now: the wishlist mutations exist (see WishlistToggle on the product
  // page) but nothing persists this toggle yet - same known gap, not introduced by this page.
  const [wishlist, setWishlist] = useState<string[]>([]);

  const { data, loading, error, refetch } = useQuery<ProductsQueryResponse>(PRODUCTS_QUERY, {
    // Revalidates on every mount/variable change instead of trusting a possibly stale cache entry
    // (e.g. after creating a product in the admin, then navigating here without a full reload).
    fetchPolicy: 'cache-and-network',
    variables: {
      filter: {
        search: debouncedSearch || undefined,
        minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
        maxPrice: priceRange[1] < DEFAULT_PRICE_RANGE[1] ? priceRange[1] : undefined,
        collectionSlug: selectedCollection ?? undefined,
        categorySlug: selectedCategory ?? undefined,
        productFamilySlug: selectedFamily ?? undefined,
        sort:
          sortBy === 'price-asc' ? 'PRICE_ASC' : sortBy === 'price-desc' ? 'PRICE_DESC' : undefined,
      },
      pagination: { page: currentPage, limit: ITEMS_PER_PAGE },
    },
    // A search term in the URL swaps this view for SearchResults below: skip the request then.
    skip: Boolean(searchTerm),
  });

  const products = data?.products.items ?? [];
  const total = data?.products.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setCurrentPage(1), [debouncedSearch]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') sessionStorage.setItem('catalogue_view', mode);
  };

  const toggleWishlist = (productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleCollectionChange = (collectionSlug: string | null) => {
    setSelectedCollection(collectionSlug);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categorySlug: string | null) => {
    setSelectedCategory(categorySlug);
    setCurrentPage(1);
  };

  const handleFamilyChange = (familySlug: string | null) => {
    setSelectedFamily(familySlug);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOrder);
    setCurrentPage(1);
  };

  const badgeLabel = (badge: string) => (tBadges.has(badge) ? tBadges(badge) : badge);
  const formatPrice = (value: number, digits: number) =>
    format.number(value, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });

  const handleAddToCart = (product: Product) => {
    const variant = product.variants[0];
    if (!variant || !variant.isAvailable) {
      toast({
        message: t('unavailable'),
        variant: 'error',
      });
      return;
    }

    addItem({
      id: `${product.id}-${variant.id}`,
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      variantLabel: variant.label,
      price: variant.price,
      quantity: 1,
      image: product.media[0]?.url,
    });

    toast({
      message: t('addedToCart', { name: product.name }),
      variant: 'success',
    });
  };

  // A search term in the URL (?q=) swaps the browsing view for the search results.
  if (searchTerm) return <SearchResults key={searchTerm} term={searchTerm} />;

  const selectedCollectionSlug = CATALOGUE_COLLECTIONS.find(
    (collection) => collection.slug === selectedCollection,
  )?.slug;
  const selectedCategorySlug = CATALOGUE_CATEGORIES.find(
    (category) => category.slug === selectedCategory,
  )?.slug;
  const selectedFamilySlug = CATALOGUE_PRODUCT_FAMILIES.find(
    (family) => family.slug === selectedFamily,
  )?.slug;
  const hasPriceFilter = priceRange[0] > 0 || priceRange[1] < DEFAULT_PRICE_RANGE[1];
  const hasActiveFilters =
    debouncedSearch !== '' ||
    selectedCollection !== null ||
    selectedCategory !== null ||
    selectedFamily !== null ||
    hasPriceFilter;

  return (
    <div className="bg-page min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b border-border-default bg-page px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-0 sm:px-6 md:px-8 md:py-7">
        <div className="flex-1">
          <p className="mb-2 text-ui-label text-text-muted">{t('eyebrow')}</p>
          <h1 className="mb-1 font-bold font-cormorant text-display-title text-text-primary">
            {t('title')}
          </h1>
          <p className="text-body-sm text-text-muted">
            {loading ? t('loading') : t('productCount', { count: total })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-ui-label text-text-muted">{t('sortBy')}</span>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="border-0 border-b border-border-default bg-transparent pb-0.5 text-body-sm text-text-primary outline-none cursor-pointer"
            >
              <option value="featured">{t('sortFeatured')}</option>
              <option value="price-asc">{t('sortPriceAsc')}</option>
              <option value="price-desc">{t('sortPriceDesc')}</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex gap-1 ms-auto sm:ms-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              aria-label={t('gridView')}
              className={`flex items-center justify-center w-8 h-8 rounded border transition-colors ${
                viewMode === 'grid'
                  ? 'border-brand-dark bg-card-subtle text-text-primary'
                  : 'border-border-default text-text-muted hover:text-text-primary'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleViewModeChange('list')}
              aria-label={t('listView')}
              className={`flex items-center justify-center w-8 h-8 rounded border transition-colors ${
                viewMode === 'list'
                  ? 'border-brand-dark bg-card-subtle text-text-primary'
                  : 'border-border-default text-text-muted hover:text-text-primary'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-8 h-8 md:hidden border border-border-default text-text-primary rounded"
            aria-label={t('toggleFilters')}
          >
            ☰
          </button>
        </div>
      </div>

      {/* Active Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-default bg-page px-4 py-2.5 sm:px-6 md:px-6">
        <span className="text-sm text-ui-label text-text-muted">{t('filters')}</span>

        {debouncedSearch && (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            {t('searchChip', { term: debouncedSearch })}
            <button
              type="button"
              onClick={() => setSearchInput('')}
              aria-label={t('removeFilter')}
              className="ms-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {selectedCollectionSlug && (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            {tFilters(`collections.${selectedCollectionSlug}`)}
            <button
              type="button"
              onClick={() => handleCollectionChange(null)}
              aria-label={t('removeFilter')}
              className="ms-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {selectedCategorySlug && (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            {tFilters(`categories.${selectedCategorySlug}`)}
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              aria-label={t('removeFilter')}
              className="ms-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {selectedFamilySlug && (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            {tFilters(`families.${selectedFamilySlug}`)}
            <button
              type="button"
              onClick={() => handleFamilyChange(null)}
              aria-label={t('removeFilter')}
              className="ms-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {hasPriceFilter ? (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            {formatPrice(priceRange[0], 0)} — {formatPrice(priceRange[1], 0)}
            <button
              type="button"
              onClick={() => handlePriceChange(DEFAULT_PRICE_RANGE)}
              aria-label={t('removeFilter')}
              className="ms-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setSelectedCollection(null);
              setSelectedCategory(null);
              setSelectedFamily(null);
              setPriceRange(DEFAULT_PRICE_RANGE);
              setCurrentPage(1);
            }}
            className="ms-auto border-b border-border-default pb-0.5 text-sm text-ui-label text-text-muted cursor-pointer"
          >
            {t('clearAll')}
          </button>
        ) : null}
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] min-h-175">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <CatalogueSidebar
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            selectedCollection={selectedCollection}
            onCollectionChange={handleCollectionChange}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            selectedFamily={selectedFamily}
            onFamilyChange={handleFamilyChange}
            onPriceChange={handlePriceChange}
            priceRange={priceRange}
          />
        </div>

        {/* Products Grid / List */}
        <div className="p-4 sm:p-5 md:p-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
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
              <p className="text-body-base text-text-muted">{t('loadFailed')}</p>
              <Button onClick={() => refetch()}>{t('retry')}</Button>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorite={wishlist.includes(product.id)}
                      onToggleWishlist={toggleWishlist}
                    />
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border-default/60">
                  {products.map((product) => {
                    const isFavorite = wishlist.includes(product.id);
                    const isAvailable = product.variants[0]?.isAvailable ?? true;

                    return (
                      <div
                        key={product.id}
                        className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 py-5 px-2 transition-all ${
                          !isAvailable ? 'opacity-60 grayscale-35' : 'hover:bg-[#FBFBFA]/60'
                        }`}
                      >
                        {/* Left: Clickable Image and Details */}
                        <div className="flex items-start gap-5 flex-1 min-w-0">
                          <Link
                            href={`/products/${product.slug}`}
                            className="relative h-28 w-24 shrink-0 bg-[#FBFBFA] overflow-hidden border border-border-default/60 group"
                          >
                            {!isAvailable ? (
                              <span className="absolute inset-s-1.5 top-1.5 z-10 bg-[#782424] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white">
                                {t('soldOut')}
                              </span>
                            ) : product.badges && product.badges.length > 0 ? (
                              <span className="absolute inset-s-1.5 top-1.5 z-10 bg-[#2A2421] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-widest text-white">
                                {badgeLabel(product.badges[0])}
                              </span>
                            ) : null}

                            {product.media[0] && (
                              <Image
                                src={product.media[0].url}
                                alt={product.name}
                                fill
                                unoptimized={isLocalMediaUrl(product.media[0].url)}
                                className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                              />
                            )}
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link href={`/products/${product.slug}`} className="group inline-block">
                              <h3 className="font-medium text-body-base text-text-primary uppercase tracking-wider group-hover:underline truncate">
                                {product.name}
                              </h3>
                            </Link>
                            <p className="text-body-sm text-text-muted line-clamp-2 mt-1 font-light">
                              {product.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2.5">
                              <span className="font-medium text-body-base text-text-primary">
                                {formatPrice(product.variants[0]?.price ?? 0, 2)}
                              </span>
                              {product.variants[0]?.label && (
                                <span className="text-xs text-text-muted border border-border-default/70 px-1.5 py-0.5">
                                  {product.variants[0].label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Add to Cart and Wishlist */}
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end shrink-0 sm:ps-4">
                          <button
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => handleAddToCart(product)}
                            className="border border-border-default bg-page px-5 py-2 text-[11px] font-medium uppercase tracking-widest text-text-primary transition-colors hover:border-brand-dark hover:bg-[#2A2421] hover:text-white disabled:opacity-40 disabled:hover:bg-page disabled:hover:text-text-primary disabled:cursor-not-allowed cursor-pointer"
                          >
                            {isAvailable ? t('addToBag') : t('soldOut')}
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleWishlist(product.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-default/70 bg-page hover:border-border-focus transition-colors cursor-pointer"
                            aria-label={t('addToWishlist')}
                          >
                            <Heart
                              className={`h-3.5 w-3.5 transition-colors ${
                                isFavorite
                                  ? 'fill-red-600 text-red-600'
                                  : 'text-text-muted hover:text-text-primary'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interactive Pagination */}
              {total > 0 && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1.5 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('previousPage')}
                  >
                    <span className="inline-block rtl:-scale-x-100">‹</span>
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center bg-page text-body-sm transition-colors ${
                        currentPage === page
                          ? 'border-1.5 border-border-focus font-medium text-text-primary'
                          : 'border border-border-default text-text-muted hover:border-border-focus'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label={t('nextPage')}
                  >
                    <span className="inline-block rtl:-scale-x-100">›</span>
                  </button>
                </div>
              )}

              {total === 0 && (
                <div className="py-12 text-center">
                  <p className="text-body-base text-text-muted">{t('empty')}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static rendering.
export default function CataloguePage() {
  return (
    <Suspense fallback={null}>
      <CatalogueContent />
    </Suspense>
  );
}
