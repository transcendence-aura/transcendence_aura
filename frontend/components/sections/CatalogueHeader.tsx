'use client';

import { CategoryCard } from '@/components/cards/CategoryCard';

interface CatalogueHeaderProps {
  collections: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  activeCollection?: string;
  activeCategory?: string | undefined;
  onCollectionChange?: (slug: string) => void;
  onCategoryChange?: (slug: string | undefined) => void;
}

export const CatalogueHeader = ({
  collections,
  categories,
  activeCollection = collections[0]?.slug,
  activeCategory,
  onCollectionChange,
  onCategoryChange,
}: CatalogueHeaderProps) => {
  return (
    <div className="space-y-8 py-8">
      {/* Collection Tabs */}
      <div>
        <h2 className="text-display-title font-cormorant text-text-primary mb-6 uppercase">
          Shop by Collection
        </h2>
        <div
          role="tablist"
          className="flex gap-8 border-b border-border-default pb-3 overflow-x-auto"
        >
          {collections.map((collection) => {
            const isActive = collection.slug === activeCollection;
            return (
              <span
                key={collection.id}
                role="tab"
                aria-selected={isActive}
                tabIndex={0}
                onClick={() => onCollectionChange?.(collection.slug)}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && onCollectionChange?.(collection.slug)
                }
                className={`text-ui-button uppercase tracking-wider cursor-pointer transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${
                  isActive
                    ? 'text-text-primary border-b-2 border-text-primary pb-1'
                    : 'text-text-muted hover:text-text-primary border-b-2 border-transparent'
                }`}
              >
                {collection.name}
              </span>
            );
          })}
        </div>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-body-base font-medium text-text-primary mb-4 uppercase">
            Filter by Category
          </h3>
          <div className="flex flex-wrap gap-3">
            <CategoryCard
              label="All"
              variant={!activeCategory ? 'active' : 'default'}
              onClick={() => onCategoryChange?.(undefined)}
            />
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                label={category.name}
                variant={category.slug === activeCategory ? 'active' : 'default'}
                onClick={() => onCategoryChange?.(category.slug)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
