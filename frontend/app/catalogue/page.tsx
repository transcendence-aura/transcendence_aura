'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { CatalogueSidebar } from '@/components/catalogue/CatalogueSidebar';
import { ProductCard } from '@/components/cards/ProductCard';

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
        id: 'media-1',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Vitamin C Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'var-1',
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
        id: 'media-2',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Rosehip Oil',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'var-2',
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
        id: 'media-3',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Barrier Cream',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'var-3',
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
    categoryId: '2',
    skinTypeIds: ['3'],
    media: [
      {
        id: 'media-4',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Eye Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'var-4',
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
        id: 'media-5',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Retinol Serum',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'var-5',
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
        id: 'media-6',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Face Mist',
        position: 0,
      },
    ],
    variants: [
      {
        id: 'var-6',
        label: '100ml',
        isAvailable: true,
        price: 38,
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

const sortProducts = (products: Product[], sortBy: SortOrder): Product[] => {
  const sorted = [...products];

  switch (sortBy) {
    case 'price-asc':
      return sorted.sort((a, b) => {
        const priceA = a.variants[0]?.price || 0;
        const priceB = b.variants[0]?.price || 0;
        return priceA - priceB;
      });
    case 'price-desc':
      return sorted.sort((a, b) => {
        const priceA = a.variants[0]?.price || 0;
        const priceB = b.variants[0]?.price || 0;
        return priceB - priceA;
      });
    default:
      return sorted;
  }
};

export default function CataloguePage() {
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [sortBy, setSortBy] = useState<SortOrder>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handlePriceChange = (range: [number, number]) => {
    setPriceRange(range);
  };

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter((product) => {
      const minPrice = Math.min(...product.variants.map((v) => v.price));

      /* Price filter */
      const priceMatch = minPrice >= priceRange[0] && minPrice <= priceRange[1];

      /* Category filter - if nothing selected, all products pass */
      const categoryMatch =
        selectedCategories.length === 0 || selectedCategories.includes(product.categoryId || '');

      /* Skin type filter - if nothing selected, all products pass */
      const skinTypeMatch =
        selectedSkinTypes.length === 0 ||
        (product.skinTypeIds || []).some((id) => selectedSkinTypes.includes(id));

      return priceMatch && categoryMatch && skinTypeMatch;
    });
  }, [priceRange, selectedCategories, selectedSkinTypes]);

  const sortedProducts = sortProducts(filteredProducts, sortBy);

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

        {/* Sort & View Controls */}
        <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-sm text-ui-label text-text-muted">Sort by</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOrder)}
              className="border-0 border-b border-border-default bg-transparent pb-0.5 text-body-sm text-text-primary outline-none cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>

          {/* Grid/List View Icons */}
          <div className="flex gap-0.5 ml-auto sm:ml-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center text-sm w-7 h-7 ${
                viewMode === 'grid'
                  ? 'border-1.5 border-border-focus text-text-primary'
                  : 'border border-border-default text-text-muted'
              }`}
            >
              ⊞
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center text-sm w-7 h-7 ${
                viewMode === 'list'
                  ? 'border-1.5 border-border-focus text-text-primary'
                  : 'border border-border-default text-text-muted'
              }`}
            >
              ≡
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center justify-center w-7 h-7 md:hidden border border-border-default text-text-primary"
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
              onClick={() => setSelectedCategories(selectedCategories.filter((id) => id !== catId))}
              className="ml-1 text-xs text-text-muted hover:text-text-primary"
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
              onClick={() => setSelectedSkinTypes(selectedSkinTypes.filter((id) => id !== skinId))}
              className="ml-1 text-xs text-text-muted hover:text-text-primary"
            >
              ✕
            </button>
          </div>
        ))}

        {priceRange[0] > 0 || priceRange[1] < 1000 ? (
          <div className="flex items-center gap-1.5 border border-border-default px-2.5 py-1 text-body-sm text-text-primary">
            €{priceRange[0]} — €{priceRange[1]}
            <button
              onClick={() => setPriceRange([0, 1000])}
              className="ml-1 text-xs text-text-muted hover:text-text-primary"
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
            onClick={() => {
              setSelectedCategories([]);
              setSelectedSkinTypes([]);
              setPriceRange([0, 1000]);
            }}
            className="ml-auto border-b border-border-default pb-0.5 text-sm text-ui-label text-text-muted"
          >
            Clear all
          </button>
        ) : null}
      </div>

      {/* Main Layout: Sidebar + Grid */}
      <div className="grid grid-cols-1 md:grid-cols-[210px_1fr] min-h-175">
        {/* Sidebar - Hidden on mobile, shown on md+ or when toggled */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block`}>
          <CatalogueSidebar
            onCategoryChange={setSelectedCategories}
            onSkinTypeChange={setSelectedSkinTypes}
            onPriceChange={handlePriceChange}
            priceRange={priceRange}
          />
        </div>

        {/* Products Grid/List */}
        <div className="p-4 sm:p-5 md:p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 md:gap-5">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {sortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 border-b border-border-default pb-4 sm:flex-row"
                >
                  <div className="h-48 w-full shrink-0 bg-subtle rounded sm:h-32 sm:w-24 sm:shrink-0">
                    {product.media[0] && (
                      <Image
                        src={product.media[0].url}
                        alt={product.name}
                        width={96}
                        height={128}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium text-body-base text-text-primary">
                      {product.name}
                    </h3>
                    <p className="mb-2 text-body-sm text-text-muted">{product.description}</p>
                    <p className="font-medium text-body-base text-text-primary">
                      €{product.variants[0]?.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {sortedProducts.length > 0 && (
            <div className="mt-6 flex items-center justify-center gap-1 overflow-x-auto pb-2 sm:mt-9">
              <button className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus">
                ‹
              </button>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center border-1.5 border-border-focus bg-page font-medium text-body-sm text-text-primary">
                1
              </button>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus">
                2
              </button>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus">
                3
              </button>
              <span className="px-1 text-body-sm text-text-muted">…</span>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus">
                8
              </button>
              <button className="flex h-8 w-8 shrink-0 items-center justify-center border border-border-default bg-page text-body-sm text-text-muted hover:border-border-focus">
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
