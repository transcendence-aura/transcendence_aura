'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { CollectionCard } from '@/components/cards/CollectionCard';
import { Skeleton } from '@/components/ui/feedback/skeleton';

/* TODO: To Be Deleted once GraphQL API is ready */
const FEATURED_COLLECTIONS = [
  {
    id: 'col-1',
    key: 'skincareOils',
    slug: 'skincare-oils',
    productCount: 8,
    imagePlaceholder: 'https://placehold.co/400x400?text=Skincare',
  },
  {
    id: 'col-2',
    key: 'faceCare',
    slug: 'face-care',
    productCount: 12,
    imagePlaceholder: 'https://placehold.co/400x400?text=FaceCare',
  },
  {
    id: 'col-3',
    key: 'ritualsSun',
    slug: 'rituals-sun',
    productCount: 6,
    imagePlaceholder: 'https://placehold.co/400x400?text=Rituals',
  },
] as const;

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

  return (
    <section className="bg-subtle py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="mb-12">
          <h2 className="text-display-title font-cormorant text-text-primary uppercase tracking-wider">
            {t('title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <Suspense
            fallback={[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          >
            {FEATURED_COLLECTIONS.map((collection) => (
              <CollectionCard
                key={collection.id}
                collection={{
                  id: collection.id,
                  name: t(`${collection.key}.name`),
                  slug: collection.slug,
                  description: t(`${collection.key}.description`),
                  productCount: collection.productCount,
                  image: {
                    url: collection.imagePlaceholder,
                    altText: t(`${collection.key}.name`),
                  },
                }}
              />
            ))}
          </Suspense>
        </div>
      </div>
    </section>
  );
};
