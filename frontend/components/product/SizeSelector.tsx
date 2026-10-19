'use client';

import { useState } from 'react';
import { ProductVariant } from '@/lib/graphql/queries/products';

interface SizeSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
}

export const SizeSelector = ({ variants, onSelect }: SizeSelectorProps) => {
  const [selectedId, setSelectedId] = useState<string>(variants[0]?.id || '');

  const handleSelect = (variant: ProductVariant) => {
    if (variant.isAvailable) {
      setSelectedId(variant.id);
      onSelect(variant);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-ui-label font-jost text-text-primary uppercase">SIZE</label>
      <div className="flex gap-2 flex-wrap">
        {variants.map((variant) => (
          <button
            key={variant.id}
            onClick={() => handleSelect(variant)}
            disabled={!variant.isAvailable}
            className={`px-4 py-2 text-body-sm font-medium transition-all ${
              selectedId === variant.id
                ? 'border-2 border-text-primary bg-page text-text-primary'
                : 'border border-border-default bg-page text-text-primary'
            } ${!variant.isAvailable ? 'opacity-50 cursor-not-allowed border-border-default text-text-muted' : 'cursor-pointer hover:border-text-primary'}`}
            aria-pressed={selectedId === variant.id}
            aria-disabled={!variant.isAvailable}
          >
            {variant.label}
          </button>
        ))}
      </div>
    </div>
  );
};
