'use client';

import type { AdminCategory } from '@/lib/graphql/queries/admin-products';

export type ProductCategoryFilter = string | 'ALL';

interface ProductFilterPillsProps {
  value: ProductCategoryFilter;
  onChange: (value: ProductCategoryFilter) => void;
  categories: AdminCategory[];
  totalCount: number;
  countsBySlug: Record<string, number>;
}

export function ProductFilterPills({
  value,
  onChange,
  categories,
  totalCount,
  countsBySlug,
}: ProductFilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onChange('ALL')}
        className={`text-ui-badge rounded-pill border px-4 py-2 uppercase tracking-wider transition-colors ${
          value === 'ALL'
            ? 'bg-brand-dark border-brand-dark text-text-inverse'
            : 'border-border-default text-text-secondary hover:text-text-primary'
        }`}
      >
        All ({totalCount})
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.slug)}
          className={`text-ui-badge rounded-pill border px-4 py-2 uppercase tracking-wider transition-colors ${
            value === category.slug
              ? 'bg-brand-dark border-brand-dark text-text-inverse'
              : 'border-border-default text-text-secondary hover:text-text-primary'
          }`}
        >
          {category.name} ({countsBySlug[category.slug] ?? 0})
        </button>
      ))}
    </div>
  );
}
