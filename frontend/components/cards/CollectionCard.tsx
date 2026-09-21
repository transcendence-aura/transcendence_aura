'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/display/badge';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
  image: {
    url: string;
    altText: string;
  };
}

interface CollectionCardProps extends HTMLAttributes<HTMLDivElement> {
  collection: Collection;
  href?: string;
}

export const CollectionCard = forwardRef<HTMLDivElement, CollectionCardProps>(
  ({ collection, href = `/collections/${collection.slug}`, className = '', ...props }, ref) => {
    const t = useTranslations('CollectionCard');
    const cardContent = (
      <article
        ref={ref}
        className={`group cursor-pointer space-y-4 outline-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${className}`}
        {...props}
      >
        <div className="relative aspect-square overflow-hidden bg-page rounded-none">
          <Image
            src={collection.image.url}
            alt={collection.image.altText}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-body-base font-medium text-text-primary uppercase tracking-wide">
              {collection.name}
            </h3>
            {collection.description && (
              <p className="text-body-sm text-text-muted line-clamp-2 mt-1">
                {collection.description}
              </p>
            )}
          </div>

          {collection.productCount && (
            <p className="text-body-sm text-text-muted">
              {t('itemCount', { count: collection.productCount })}
            </p>
          )}
        </div>

        <div className="inline-block">
          <Badge variant="dark">{t('shop')}</Badge>
        </div>
      </article>
    );

    if (href) {
      return (
        <Link href={href} className="block no-underline">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  },
);

CollectionCard.displayName = 'CollectionCard';
