'use client';

import { useEffect, useState } from 'react';
import { SearchInput } from '@/components/ui/form/search-input';
import { CATALOGUE_CATEGORIES } from '@/lib/catalogue/categories';
import { CATALOGUE_COLLECTIONS } from '@/lib/catalogue/collections';
import { CATALOGUE_PRODUCT_FAMILIES } from '@/lib/catalogue/product-families';

interface CatalogueSidebarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  // null: no filter ("All").
  selectedCollection: string | null;
  onCollectionChange: (collectionSlug: string | null) => void;
  selectedCategory: string | null;
  onCategoryChange: (categorySlug: string | null) => void;
  selectedFamily: string | null;
  onFamilyChange: (familySlug: string | null) => void;
  onPriceChange: (range: [number, number]) => void;
  priceRange: [number, number];
}

// A price bound (min or max) as its own text field, decoupled from `value` while being edited.
// Deriving the input's text straight from `value` on every keystroke (the previous approach)
// fights the user: clearing the field to type a new number resolves to `Number('') || 0`, which
// for the min bound (default 0) redraws the exact same "0" the user just deleted, making it look
// stuck. Free typing is allowed here; a bad or empty value only reverts on blur.
function PriceBoundInput({
  value,
  onCommit,
  ariaLabel,
}: {
  value: number;
  onCommit: (value: number) => void;
  ariaLabel: string;
}) {
  const [text, setText] = useState(String(value));

  // Stays in sync when the bound changes from elsewhere (Clear all, removing the filter chip).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setText(String(value)), [value]);

  return (
    <div className="relative">
      <span className="text-body-sm text-text-muted pointer-events-none absolute top-1/2 left-2 -translate-y-1/2">
        €
      </span>
      <input
        type="text"
        inputMode="numeric"
        aria-label={ariaLabel}
        value={text}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          if (raw === '') return;
          const parsed = Number(raw);
          if (!Number.isNaN(parsed) && parsed >= 0) onCommit(parsed);
        }}
        onBlur={() => {
          if (Number.isNaN(Number(text)) || text === '') setText(String(value));
        }}
        className="w-16 border border-border-default bg-page py-1.5 pr-1 pl-5 text-body-sm text-text-primary font-jost outline-none"
      />
    </div>
  );
}

export const CatalogueSidebar = ({
  searchValue,
  onSearchChange,
  selectedCollection,
  onCollectionChange,
  selectedCategory,
  onCategoryChange,
  selectedFamily,
  onFamilyChange,
  onPriceChange,
  priceRange,
}: CatalogueSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    collection: false,
    category: false,
    family: false,
    price: false,
  });

  const toggleSection = (section: 'collection' | 'category' | 'family' | 'price') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="border-r border-border-default p-5">
      {/* Search - combines with every filter below (sent together as one query). */}
      <div className="mb-6">
        <SearchInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
        />
      </div>

      {/* Collection Filter - single-select, combines with Category and Product Family. */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('collection')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full"
        >
          Collection
          <span
            className={`text-brand-dark transition-transform ${expandedSections.collection ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        {expandedSections.collection && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="radio"
                name="catalogue-collection"
                checked={selectedCollection === null}
                onChange={() => onCollectionChange(null)}
                className="w-4 h-4 accent-text-primary cursor-pointer"
              />
              <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                All
              </span>
            </label>
            {CATALOGUE_COLLECTIONS.map((collection) => (
              <label
                key={collection.slug}
                className="flex items-center gap-2 cursor-pointer group select-none"
              >
                <input
                  type="radio"
                  name="catalogue-collection"
                  checked={selectedCollection === collection.slug}
                  onChange={() => onCollectionChange(collection.slug)}
                  className="w-4 h-4 accent-text-primary cursor-pointer"
                />
                <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                  {collection.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter - single-select: the backend filters by one categorySlug at a time. */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('category')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full"
        >
          Category
          <span
            className={`text-brand-dark transition-transform ${expandedSections.category ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        {expandedSections.category && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="radio"
                name="catalogue-category"
                checked={selectedCategory === null}
                onChange={() => onCategoryChange(null)}
                className="w-4 h-4 accent-text-primary cursor-pointer"
              />
              <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                All
              </span>
            </label>
            {CATALOGUE_CATEGORIES.map((category) => (
              <label
                key={category.slug}
                className="flex items-center gap-2 cursor-pointer group select-none"
              >
                <input
                  type="radio"
                  name="catalogue-category"
                  checked={selectedCategory === category.slug}
                  onChange={() => onCategoryChange(category.slug)}
                  className="w-4 h-4 accent-text-primary cursor-pointer"
                />
                <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Product Family Filter - single-select, combines with Category (both sent together). */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('family')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full"
        >
          Product Family
          <span
            className={`text-brand-dark transition-transform ${expandedSections.family ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        {expandedSections.family && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="radio"
                name="catalogue-family"
                checked={selectedFamily === null}
                onChange={() => onFamilyChange(null)}
                className="w-4 h-4 accent-text-primary cursor-pointer"
              />
              <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                All
              </span>
            </label>
            {CATALOGUE_PRODUCT_FAMILIES.map((family) => (
              <label
                key={family.slug}
                className="flex items-center gap-2 cursor-pointer group select-none"
              >
                <input
                  type="radio"
                  name="catalogue-family"
                  checked={selectedFamily === family.slug}
                  onChange={() => onFamilyChange(family.slug)}
                  className="w-4 h-4 accent-text-primary cursor-pointer"
                />
                <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                  {family.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full"
        >
          Price
          <span
            className={`text-brand-dark transition-transform ${expandedSections.price ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        {expandedSections.price && (
          <div className="flex items-center gap-2">
            <PriceBoundInput
              value={priceRange[0]}
              onCommit={(min) => onPriceChange([min, priceRange[1]])}
              ariaLabel="Minimum price"
            />
            <span className="text-body-sm text-text-muted">—</span>
            <PriceBoundInput
              value={priceRange[1]}
              onCommit={(max) => onPriceChange([priceRange[0], max])}
              ariaLabel="Maximum price"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
