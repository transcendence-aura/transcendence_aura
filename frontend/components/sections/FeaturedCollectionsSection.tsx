'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import { CollectionCard } from '@/components/cards/CollectionCard';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { GET_COLLECTIONS } from '@/lib/graphql/queries/collections';

// Always served from /public, never from the backend: heroImageUrl is a wide banner (1500x200),
// but CollectionCard shows it in a square crop - it'd be zoomed into a thin sliver. No square photo
// exists yet for hair care specifically, so it borrows this one until a dedicated one is added.
const COLLECTION_IMAGES: Record<string, string> = {
  'clean-beauty-skincare': '/images/landing/category-face-care.png',
  'botanical-hair-care': '/images/landing/category-rituals-sun.png',
};

// Serums & Oils isn't its own collection (it's a category inside Clean Beauty Skincare), but gets
// its own card here rather than through the `collections` query - a static entry, not fetched.
const SERUMS_OILS_IMAGE = '/images/landing/category-skincare-oils.png';

/* Skeleton loading card for collections grid */
const SkeletonCard = () => (
  <div className="space-y-4">
    <Skeleton className="aspect-square w-full rounded-none" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

/* Collections grid component */
export const FeaturedCollectionsSection = () => {
  const t = useTranslations('FeaturedCollections');
  const tFilters = useTranslations('CatalogueFilters');
  const { data, loading, error, refetch } = useQuery(GET_COLLECTIONS);

  // Only collections with a local image are shown - a newly created one with no entry yet in
  // COLLECTION_IMAGES simply doesn't appear here rather than falling back to a DB image.
  const collections = (data?.collections ?? []).filter((collection) =>
    Boolean(COLLECTION_IMAGES[collection.slug]),
  );

  return (
    <section className="bg-subtle py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-12">
          <h2 className="text-display-title font-cormorant text-text-primary uppercase tracking-wider">
            {t('title')}
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-body-base text-text-muted">{t('loadFailed')}</p>
            <Button onClick={() => refetch()}>{t('retry')}</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={{
                  id: collection.id,
                  name: collection.name,
                  slug: collection.slug,
                  description: collection.description ?? undefined,
                  image: {
                    url: COLLECTION_IMAGES[collection.slug],
                    altText: collection.name,
                  },
                }}
              />
            ))}
            <CollectionCard
              href="/catalogue?category=serums-and-oils"
              collection={{
                id: 'serums-and-oils',
                name: tFilters('categories.serums-and-oils'),
                slug: 'serums-and-oils',
                description: t('serumsOilsDescription'),
                image: {
                  url: SERUMS_OILS_IMAGE,
                  altText: tFilters('categories.serums-and-oils'),
                },
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
};
