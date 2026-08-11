'use client';

import { useState, Suspense } from 'react';
import { CatalogueHeader } from '@/components/sections/CatalogueHeader';
import { ProductCard } from '@/components/cards/ProductCard';
import { Skeleton } from '@/components/ui/feedback/skeleton';

/* TODO: Replace mock data with GraphQL products query once backend schema is updated */
const MOCK_COLLECTIONS = [
  { id: '1', name: 'Skincare', slug: 'skincare' },
  { id: '2', name: 'Haircare', slug: 'haircare' },
];

const MOCK_CATEGORIES = [
  { id: '1', name: 'Face', slug: 'face' },
  { id: '2', name: 'Hair', slug: 'hair' },
];

/* TODO: Remove when connected to backend products query */
const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    slug: 'vitamin-c-serum',
    name: 'Vitamin C Serum',
    description: 'Brightening serum with stable vitamin C complex.',
    media: [
      {
        id: 'media-1',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Vitamin C Serum bottle',
        position: 0,
      },
    ],
    variants: [{ id: 'var-1', label: '30ml', isAvailable: true, price: 32.5 }],
  },
  {
    id: 'prod-2',
    slug: 'rosehip-face-oil',
    name: 'Rosehip Face Oil',
    description: 'Nourishing oil with antioxidants and vitamins.',
    media: [
      {
        id: 'media-2',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Rosehip Face Oil bottle',
        position: 0,
      },
    ],
    variants: [{ id: 'var-2', label: '50ml', isAvailable: true, price: 28.0 }],
  },
  {
    id: 'prod-3',
    slug: 'balancing-shampoo',
    name: 'Balancing Daily Shampoo',
    description: 'Sulfate-free shampoo for all hair types.',
    media: [
      {
        id: 'media-3',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Balancing Shampoo bottle',
        position: 0,
      },
    ],
    variants: [{ id: 'var-3', label: '250ml', isAvailable: true, price: 18.5 }],
  },
  {
    id: 'prod-4',
    slug: 'hydrating-mask',
    name: 'Hydrating Face Mask',
    description: 'Deep moisture treatment for dry skin.',
    media: [
      {
        id: 'media-4',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Hydrating Mask jar',
        position: 0,
      },
    ],
    variants: [{ id: 'var-4', label: '100ml', isAvailable: true, price: 42.0 }],
  },
  {
    id: 'prod-5',
    slug: 'body-lotion',
    name: 'Nourishing Body Lotion',
    description: 'Lightweight moisturizer for silky soft skin.',
    media: [
      {
        id: 'media-5',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Body Lotion bottle',
        position: 0,
      },
    ],
    variants: [{ id: 'var-5', label: '200ml', isAvailable: true, price: 24.0 }],
  },
  {
    id: 'prod-6',
    slug: 'hair-conditioner',
    name: 'Restorative Hair Conditioner',
    description: 'Repair and strengthen with botanical blend.',
    media: [
      {
        id: 'media-6',
        url: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
        altText: 'Hair Conditioner bottle',
        position: 0,
      },
    ],
    variants: [{ id: 'var-6', label: '250ml', isAvailable: true, price: 22.0 }],
  },
];

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="space-y-4">
        <Skeleton className="aspect-square w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-10 w-24" />
      </div>
    ))}
  </div>
);

export default function CataloguePage() {
  const [activeCollection, setActiveCollection] = useState(MOCK_COLLECTIONS[0]?.slug);
  const [activeCategory, setActiveCategory] = useState<string | undefined>();

  const filteredProducts = MOCK_PRODUCTS.filter(() => {
    return true;
  });

  return (
    <div className="bg-page min-h-screen">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-16">
        <CatalogueHeader
          collections={MOCK_COLLECTIONS}
          categories={MOCK_CATEGORIES}
          activeCollection={activeCollection}
          activeCategory={activeCategory}
          onCollectionChange={setActiveCollection}
          onCategoryChange={setActiveCategory}
        />

        <div className="mt-16">
          {filteredProducts.length > 0 ? (
            <Suspense fallback={<SkeletonGrid />}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </Suspense>
          ) : (
            <div className="text-center py-16">
              <p className="text-body-base text-text-muted">
                No products found. Try a different filter.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
