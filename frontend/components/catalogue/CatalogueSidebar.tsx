'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronRight, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/form/search-input';
import { CATALOGUE_CATEGORIES } from '@/lib/catalogue/categories';
import { CATALOGUE_COLLECTIONS } from '@/lib/catalogue/collections';
import { CATALOGUE_PRODUCT_FAMILIES } from '@/lib/catalogue/product-families';

interface CatalogueSidebarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  selectedCollection: string | null;
  onCollectionChange: (collectionSlug: string | null) => void;
  selectedCategory: string | null;
  onCategoryChange: (categorySlug: string | null) => void;
  selectedFamily: string | null;
  onFamilyChange: (familySlug: string | null) => void;
  onPriceChange: (range: [number, number]) => void;
  priceRange: [number, number];
  onCloseMobile?: () => void;
}

function PriceBoundInput({
  value,
  onCommit,
  ariaLabel,
  validate,
}: {
  value: number;
  onCommit: (value: number) => void;
  ariaLabel: string;
  validate: (parsed: number) => string | null;
}) {
  const [prevValue, setPrevValue] = useState(value);
  const [text, setText] = useState(String(value));
  const [error, setError] = useState<string | null>(null);

  // Sync state during render when prop changes (avoids cascading render effect)
  if (value !== prevValue) {
    setPrevValue(value);
    setText(String(value));
    setError(null);
  }

  return (
    <div>
      <div className="relative">
        <span className="text-body-sm text-text-muted pointer-events-none absolute top-1/2 start-2.5 -translate-y-1/2">
          €
        </span>
        <input
          type="text"
          dir="ltr"
          inputMode="numeric"
          aria-label={ariaLabel}
          aria-invalid={error !== null}
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^0-9.]/g, '');
            setText(raw);
            if (raw === '') {
              setError(null);
              return;
            }
            const parsed = Number(raw);
            if (Number.isNaN(parsed)) return;

            const validationError = validate(parsed);
            setError(validationError);
            if (!validationError) onCommit(parsed);
          }}
          onBlur={() => {
            const parsed = Number(text);
            if (Number.isNaN(parsed) || text === '' || validate(parsed)) {
              setText(String(value));
              setError(null);
            }
          }}
          className={`w-20 border bg-page py-1.5 pe-2 ps-7 text-body-sm text-text-primary font-jost outline-none ${
            error ? 'border-status-error' : 'border-border-default'
          }`}
        />
      </div>
      {error && (
        <p role="alert" className="text-status-error mt-1 text-[11px]">
          {error}
        </p>
      )}
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
  onCloseMobile,
}: CatalogueSidebarProps) => {
  const t = useTranslations('CatalogueFilters');
  const [expandedSections, setExpandedSections] = useState({
    collection: true,
    category: true,
    family: Boolean(selectedFamily),
    price: true,
  });

  const toggleSection = (section: 'collection' | 'category' | 'family' | 'price') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="p-5 md:border-e md:border-border-default h-full overflow-y-auto">
      {/* Mobile Header with Close Button */}
      {onCloseMobile && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-default md:hidden">
          <span className="font-cormorant text-display-title text-text-primary uppercase">
            {t('all')}
          </span>
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1 text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <SearchInput
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchLabel')}
        />
      </div>

      {/* Collection Filter */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('collection')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full cursor-pointer"
        >
          {t('collection')}
          <ChevronRight
            className={`h-4 w-4 text-brand-dark transition-transform duration-200 rtl:-scale-x-100 ${
              expandedSections.collection ? 'rotate-90 rtl:-rotate-90' : ''
            }`}
          />
        </button>

        {expandedSections.collection && (
          <div className="space-y-1" role="radiogroup" aria-label={t('collection')}>
            <button
              type="button"
              role="radio"
              aria-checked={selectedCollection === null}
              onClick={() => onCollectionChange(null)}
              className={`flex items-center gap-2 w-full text-start py-1 px-1.5 transition-colors cursor-pointer focus:outline-none outline-none ${
                selectedCollection === null
                  ? 'border-s-2 border-brand-accent bg-[#2A2421]/4 text-text-primary font-medium text-body-sm'
                  : 'text-text-secondary hover:text-text-primary text-body-sm font-normal'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                  selectedCollection === null ? 'bg-brand-accent' : 'bg-transparent'
                }`}
              />
              <span className="truncate">{t('all')}</span>
            </button>

            {CATALOGUE_COLLECTIONS.map((collection) => {
              const isSelected = selectedCollection === collection.slug;
              return (
                <button
                  key={collection.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onCollectionChange(collection.slug)}
                  className={`flex items-center gap-2 w-full text-start py-1 px-1.5 transition-colors cursor-pointer focus:outline-none outline-none ${
                    isSelected
                      ? 'border-s-2 border-brand-accent bg-[#2A2421]/4 text-text-primary font-medium text-body-sm'
                      : 'text-text-secondary hover:text-text-primary text-body-sm font-normal'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                      isSelected ? 'bg-brand-accent' : 'bg-transparent'
                    }`}
                  />
                  <span className="truncate">{t(`collections.${collection.slug}`)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('category')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full cursor-pointer"
        >
          {t('category')}
          <ChevronRight
            className={`h-4 w-4 text-brand-dark transition-transform duration-200 rtl:-scale-x-100 ${
              expandedSections.category ? 'rotate-90 rtl:-rotate-90' : ''
            }`}
          />
        </button>

        {expandedSections.category && (
          <div className="space-y-1" role="radiogroup" aria-label={t('category')}>
            <button
              type="button"
              role="radio"
              aria-checked={selectedCategory === null}
              onClick={() => onCategoryChange(null)}
              className={`flex items-center gap-2 w-full text-start py-1 px-1.5 transition-colors cursor-pointer focus:outline-none outline-none ${
                selectedCategory === null
                  ? 'border-s-2 border-brand-accent bg-[#2A2421]/4 text-text-primary font-medium text-body-sm'
                  : 'text-text-secondary hover:text-text-primary text-body-sm font-normal'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                  selectedCategory === null ? 'bg-brand-accent' : 'bg-transparent'
                }`}
              />
              <span className="truncate">{t('all')}</span>
            </button>

            {CATALOGUE_CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.slug;
              return (
                <button
                  key={category.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onCategoryChange(category.slug)}
                  className={`flex items-center gap-2 w-full text-start py-1 px-1.5 transition-colors cursor-pointer focus:outline-none outline-none ${
                    isSelected
                      ? 'border-s-2 border-brand-accent bg-[#2A2421]/4 text-text-primary font-medium text-body-sm'
                      : 'text-text-secondary hover:text-text-primary text-body-sm font-normal'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                      isSelected ? 'bg-brand-accent' : 'bg-transparent'
                    }`}
                  />
                  <span className="truncate">{t(`categories.${category.slug}`)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Family Filter */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('family')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full cursor-pointer"
        >
          {t('family')}
          <ChevronRight
            className={`h-4 w-4 text-brand-dark transition-transform duration-200 rtl:-scale-x-100 ${
              expandedSections.family ? 'rotate-90 rtl:-rotate-90' : ''
            }`}
          />
        </button>

        {expandedSections.family && (
          <div className="space-y-1" role="radiogroup" aria-label={t('family')}>
            <button
              type="button"
              role="radio"
              aria-checked={selectedFamily === null}
              onClick={() => onFamilyChange(null)}
              className={`flex items-center gap-2 w-full text-start py-1 px-1.5 transition-colors cursor-pointer focus:outline-none outline-none ${
                selectedFamily === null
                  ? 'border-s-2 border-brand-accent bg-[#2A2421]/4 text-text-primary font-medium text-body-sm'
                  : 'text-text-secondary hover:text-text-primary text-body-sm font-normal'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                  selectedFamily === null ? 'bg-brand-accent' : 'bg-transparent'
                }`}
              />
              <span className="truncate">{t('all')}</span>
            </button>

            {CATALOGUE_PRODUCT_FAMILIES.map((family) => {
              const isSelected = selectedFamily === family.slug;
              return (
                <button
                  key={family.slug}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => onFamilyChange(family.slug)}
                  className={`flex items-center gap-2 w-full text-start py-1 px-1.5 transition-colors cursor-pointer focus:outline-none outline-none ${
                    isSelected
                      ? 'border-s-2 border-brand-accent bg-[#2A2421]/4 text-text-primary font-medium text-body-sm'
                      : 'text-text-secondary hover:text-text-primary text-body-sm font-normal'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full shrink-0 transition-all ${
                      isSelected ? 'bg-brand-accent' : 'bg-transparent'
                    }`}
                  />
                  <span className="truncate">{t(`families.${family.slug}`)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div>
        <button
          type="button"
          onClick={() => toggleSection('price')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full cursor-pointer"
        >
          {t('price')}
          <ChevronRight
            className={`h-4 w-4 text-brand-dark transition-transform duration-200 rtl:-scale-x-100 ${
              expandedSections.price ? 'rotate-90 rtl:-rotate-90' : ''
            }`}
          />
        </button>

        {expandedSections.price && (
          <div className="flex items-start gap-2 pt-1">
            <PriceBoundInput
              value={priceRange[0]}
              onCommit={(min) => onPriceChange([min, priceRange[1]])}
              validate={(min) =>
                min > priceRange[1] ? t('maxIs', { value: priceRange[1] }) : null
              }
              ariaLabel={t('minPrice')}
            />
            <span className="text-body-sm text-text-muted pt-1.5">—</span>
            <PriceBoundInput
              value={priceRange[1]}
              onCommit={(max) => onPriceChange([priceRange[0], max])}
              validate={(max) =>
                max < priceRange[0] ? t('minIs', { value: priceRange[0] }) : null
              }
              ariaLabel={t('maxPrice')}
            />
          </div>
        )}
      </div>
    </aside>
  );
};
