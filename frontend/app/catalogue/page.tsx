'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid, List, Heart, ShoppingBag } from 'lucide-react';
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar';
import { ProductCard } from '@/components/cards/ProductCard';
import { useCart } from '@/lib/hooks/useCart';
import { useToast } from '@/components/ui/feedback/toast';

type SortOrder = 'featured' | 'price-asc' | 'price-desc';
type ViewMode = 'grid' | 'list';

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  badges: string[];
  media: Array<{
    id: string;
    url: string;
    altText: string | null;
    position: number;
  }>;
  variants: Array<{
    id: string;
    label: string;
    isAvailable: boolean;
    price: number;
    isOnSale: boolean;
    discountPercentage: number;
  }>;
  categoryId?: string;
  skinTypeIds?: string[];
}

/*
 * TODO: GraphQL Integration
 * 1. Replace MOCK_PRODUCTS with real Apollo Client query (GET_PRODUCTS).
 * 2. Use filtering, sorting, and pagination variables (limit, offset) from GraphQL arguments.
 * 3. Clean up client-side mock data array when backend resolver is active.
 */
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    slug: 'vitamin-c-serum',
    name: 'Vitamin C Serum',
    description: 'Brightening serum with stable vitamin C complex.',
    badges: ['Bestseller'],
    categoryId: '1',
    skinTypeIds: ['2', '3'],
    media: [
      {
        id: 'm-1',
        url: '/images/products/product-vitamin-c-serum.jpg',
        altText: 'Vitamin C Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-1',
        label: '30ml',
        isAvailable: true,
        price: 64,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-2',
    slug: 'rosehip-face-oil',
    name: 'Rosehip Face Oil',
    description: 'Nourishing oil with antioxidants.',
    badges: ['New'],
    categoryId: '1',
    skinTypeIds: ['3', '4'],
    media: [
      {
        id: 'm-2',
        url: '/images/products/product-rosehip-face-oil.jpg',
        altText: 'Rosehip Oil',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-2',
        label: '50ml',
        isAvailable: true,
        price: 52,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-3',
    slug: 'barrier-repair-cream',
    name: 'Barrier Repair Cream',
    description: 'Deep repair moisturizer.',
    badges: ['Sale'],
    categoryId: '2',
    skinTypeIds: ['2', '3'],
    media: [
      {
        id: 'm-3',
        url: '/images/products/product-barrier-repair-cream.jpg',
        altText: 'Barrier Cream',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-3',
        label: '100ml',
        isAvailable: true,
        price: 48,
        isOnSale: true,
        discountPercentage: 15,
      },
    ],
  },
  {
    id: 'prod-4',
    slug: 'brightening-eye-serum',
    name: 'Brightening Eye Serum',
    description: 'Targeted eye care serum.',
    badges: [],
    categoryId: '1',
    skinTypeIds: ['3'],
    media: [
      {
        id: 'm-4',
        url: '/images/products/product-brightening-eye-serum.jpg',
        altText: 'Eye Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-4',
        label: '15ml',
        isAvailable: true,
        price: 44,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-5',
    slug: 'retinol-night-serum',
    name: 'Retinol Night Serum',
    description: 'Powerful night treatment.',
    badges: [],
    categoryId: '1',
    skinTypeIds: ['4'],
    media: [
      {
        id: 'm-5',
        url: '/images/products/product-retinol-night-serum.jpg',
        altText: 'Retinol Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-5',
        label: '30ml',
        isAvailable: true,
        price: 72,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-6',
    slug: 'hydrating-face-mist',
    name: 'Hydrating Face Mist',
    description: 'Refreshing hydrating mist for instant skin hydration.',
    badges: [],
    categoryId: '2',
    skinTypeIds: ['2', '3', '4'],
    media: [
      {
        id: 'm-6',
        url: '/images/products/product-hydrating-face-mist.jpg',
        altText: 'Face Mist',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-6',
        label: '100ml',
        isAvailable: true,
        price: 38,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-7',
    slug: 'balancing-toner',
    name: 'Balancing Toner',
    description: 'Clarifying and pore-refining facial toner.',
    badges: [],
    categoryId: '2',
    skinTypeIds: ['3', '4'],
    media: [
      {
        id: 'm-7',
        url: '/images/products/product-balancing-toner.jpg',
        altText: 'Balancing Toner',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-7',
        label: '150ml',
        isAvailable: true,
        price: 36,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-8',
    slug: 'gentle-cleansing-oil',
    name: 'Gentle Cleansing Oil',
    description: 'Melt away impurities without stripping moisture.',
    badges: ['Bestseller'],
    categoryId: '2',
    skinTypeIds: ['2', '3', '4'],
    media: [
      {
        id: 'm-8',
        url: '/images/products/product-gentle-cleansing-oil.jpg',
        altText: 'Cleansing Oil',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-8',
        label: '120ml',
        isAvailable: true,
        price: 42,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-9',
    slug: 'gentle-face-wash',
    name: 'Gentle Face Wash',
    description: 'Mild foaming daily gel cleanser.',
    badges: [],
    categoryId: '2',
    skinTypeIds: ['2', '3'],
    media: [
      {
        id: 'm-9',
        url: '/images/products/product-gentle-face-wash.jpg',
        altText: 'Face Wash',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-9',
        label: '150ml',
        isAvailable: true,
        price: 34,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-10',
    slug: 'deep-hydration-mask',
    name: 'Deep Hydration Mask',
    description: 'Overnight moisture surge infusion treatment.',
    badges: ['Ritual'],
    categoryId: '3',
    skinTypeIds: ['2'],
    media: [
      {
        id: 'm-10',
        url: '/images/products/product-deep-hydration-mask.jpg',
        altText: 'Hydration Mask',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-10',
        label: '75ml',
        isAvailable: true,
        price: 56,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-11',
    slug: 'intensive-night-cream',
    name: 'Intensive Night Cream',
    description: 'Cellular recovery and overnight barrier nourishment.',
    badges: [],
    categoryId: '2',
    skinTypeIds: ['2', '3'],
    media: [
      {
        id: 'm-11',
        url: '/images/products/product-intensive-night-cream.jpg',
        altText: 'Night Cream',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-11',
        label: '50ml',
        isAvailable: true,
        price: 68,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
  {
    id: 'prod-12',
    slug: 'luminous-face-serum',
    name: 'Luminous Face Serum',
    description: 'Radiance booster for dull and fatigued complexions.',
    badges: ['New'],
    categoryId: '1',
    skinTypeIds: ['2', '3', '4'],
    media: [
      {
        id: 'm-12',
        url: '/images/products/product-luminous-face-serum.jpg',
        altText: 'Luminous Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'v-12',
        label: '30ml',
        isAvailable: true,
        price: 58,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
  },
];

const CATEGORIES_MAP: Record<string, string> = {
  '1': 'Serums & Oils',
  '2': 'Face Care',
  '3': 'Ritual Sets',
};

const SKIN_TYPES_MAP: Record<string, string> = {
  '2': 'Dry skin',
  '3': 'Sensitive skin',
  '4': 'Oily skin',
};

const ITEMS_PER_PAGE = 9;

const sortProducts = (products: Product[], sortBy: SortOrder): Product[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
    case 'price-desc':
      return sorted.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
    default:
      return sorted;
  }
};

export default function CataloguePage() {
  const { addItem } = useCart();
  const { toast } = useToast();

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<SortOrder>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (sessionStorage.getItem('catalogue_view') as ViewMode) || 'grid';
    }
    return 'grid';
  });
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [wishlist, setWishlist] = useState<string[]>([]);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('catalogue_view', mode);
    }
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

  const handleCategoryChange = (categories: string[]) => {
    setSelectedCategories(categories);
    setCurrentPage(1);
  };

  const handleSkinTypeChange = (skinTypes: string[]) => {
    setSelectedSkinTypes(skinTypes);
    setCurrentPage(1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as SortOrder);
    setCurrentPage(1);
  };

  const handleAddToCart = (product: Product) => {
    const variant = product.variants[0];
    if (!variant || !variant.isAvailable) return;

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
      message: `Added ${product.name} to cart`,
      variant: 'success',
    });
  };

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const minPrice = Math.min(...product.variants.map((v) => v.price));
      const priceMatch = minPrice >= priceRange[0] && minPrice <= priceRange[1];
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(product.categoryId || '');
      const skinTypeMatch =
        selectedSkinTypes.length === 0 ||
        (product.skinTypeIds || []).some((id) => selectedSkinTypes.includes(id));

      return priceMatch && categoryMatch && skinTypeMatch;
    });
  }, [priceRange, selectedCategories, selectedSkinTypes]);

  const sortedProducts = sortProducts(filteredProducts, sortBy);

  const totalPages = Math.ceil(sortedProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedProducts, currentPage]);

  return (
    <div className="bg-page min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b border-border-default bg-page px-4 py-5 sm:flex-row sm:items-end sm:justify-between sm:gap-0 sm:px-6 md:px-8 md:py-7">
        <div className="flex-1">
          <p className="mb-2 text-ui-label text-text-muted">Our collection</p>
          <h1 className="mb-1 font-bold font-cormorant text-display-title text-text-primary">
            All Products
          </h1>
          <p className="text-body-sm text-text-muted">{sortedProducts.length} products</p>
        </div>

        {/* Controls */}
        <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-ui-label text-text-muted">Sort by</span>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="border-0 border-b border-border-default bg-transparent pb-0.5 text-body-sm text-text-primary outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Grid / List View Toggle */}
          <div className="flex gap-1 ml-auto sm:ml-0">
            <button
              type="button"
              onClick={() => handleViewModeChange('grid')}
              aria-label="Grid view"
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
              aria-label="List view"
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
            aria-label="Toggle filters"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Active Filters Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-default bg-page px-4 py-2.5 sm:px-6 md:px-6">
        <span className="text-sm text-ui-label text-text-muted">Filters</span>

        {selectedCategories.map((catId) => (
          <div
            key={`cat-${catId}`}
            className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary"
          >
            {CATEGORIES_MAP[catId]}
            <button
              type="button"
              onClick={() => {
                handleCategoryChange(selectedCategories.filter((id) => id !== catId));
              }}
              className="ml-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}

        {selectedSkinTypes.map((skinId) => (
          <div
            key={`skin-${skinId}`}
            className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary"
          >
            {SKIN_TYPES_MAP[skinId]}
            <button
              type="button"
              onClick={() => {
                handleSkinTypeChange(selectedSkinTypes.filter((id) => id !== skinId));
              }}
              className="ml-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}

        {priceRange[0] > 0 || priceRange[1] < 1000 ? (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            €{priceRange[0]} — €{priceRange[1]}
            <button
              type="button"
              onClick={() => handlePriceChange([0, 1000])}
              className="ml-1 text-xs text-text-muted hover:text-text-primary cursor-pointer"
            >
              ✕
            </button>
          </div>
        ) : null}

        {selectedCategories.length > 0 ||
        selectedSkinTypes.length > 0 ||
        priceRange[0] > 0 ||
        priceRange[1] < 1000 ? (
          <button
            type="button"
            onClick={() => {
              setSelectedCategories([]);
              setSelectedSkinTypes([]);
              setPriceRange([0, 1000]);
              setCurrentPage(1);
            }}
            className="ml-auto border-b border-border-default pb-0.5 text-sm text-ui-label text-text-muted cursor-pointer"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] min-h-175">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <CatalogueSidebar
            onCategoryChange={handleCategoryChange}
            onSkinTypeChange={handleSkinTypeChange}
            onPriceChange={handlePriceChange}
            priceRange={priceRange}
            selectedCategories={selectedCategories}
            selectedSkinTypes={selectedSkinTypes}
          />
        </div>

        {/* Products Grid / List */}
        <div className="p-4 sm:p-5 md:p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 md:gap-5">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedProducts.map((product) => {
                const isFavorite = wishlist.includes(product.id);
                const isAvailable = product.variants[0]?.isAvailable ?? true;

                return (
                  <div
                    key={product.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-default pb-5 pt-2 hover:bg-card-subtle/30 px-2 transition-colors rounded-sm"
                  >
                    {/* Left: Clickable Image and Details (redirects to /products/[slug]) */}
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Link
                        href={`/products/${product.slug}`}
                        className="relative h-28 w-24 shrink-0 bg-[#F9F8F6] rounded overflow-hidden border border-border-default group"
                      >
                        {product.media[0] && (
                          <Image
                            src={product.media[0].url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <Link href={`/products/${product.slug}`} className="group inline-block">
                          <h3 className="font-medium text-body-base text-text-primary group-hover:underline uppercase tracking-wide truncate">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-body-sm text-text-muted line-clamp-2 mt-1">
                          {product.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-medium text-body-base text-text-primary">
                            €{product.variants[0]?.price.toFixed(2)}
                          </span>
                          {product.variants[0]?.label && (
                            <span className="text-xs text-text-muted border border-border-default px-1.5 py-0.5 rounded">
                              {product.variants[0].label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Add to Cart and Wishlist */}
                    <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0 sm:pl-4">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => handleAddToCart(product)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#2A2421] px-5 py-2 text-xs font-medium text-white hover:bg-[#1A1412] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5" />
                        <span>{isAvailable ? 'Add to bag' : 'Sold out'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleWishlist(product.id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border border-border-default bg-page hover:border-border-focus transition-colors cursor-pointer ${
                          isFavorite
                            ? 'text-red-500 fill-red-500'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                        aria-label="Add to wishlist"
                      >
                        <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Interactive Pagination */}
          {sortedProducts.length > 0 && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={currentPage === 1}
                className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                ‹
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
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}

          {sortedProducts.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-body-base text-text-muted">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
