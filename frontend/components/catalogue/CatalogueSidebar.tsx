'use client';

import { useState } from 'react';

interface CatalogueSidebarProps {
  onCategoryChange: (categories: string[]) => void;
  onSkinTypeChange: (skinTypes: string[]) => void;
  onPriceChange: (range: [number, number]) => void;
  priceRange: [number, number];
  selectedCategories?: string[];
  selectedSkinTypes?: string[];
}

const CATEGORIES = [
  { id: '1', name: 'Serums & Oils' },
  { id: '2', name: 'Face Care' },
  { id: '3', name: 'Ritual Sets' },
];

const SKIN_TYPES = [
  { id: '2', name: 'Dry skin' },
  { id: '3', name: 'Sensitive skin' },
  { id: '4', name: 'Oily skin' },
];

export const CatalogueSidebar = ({
  onCategoryChange,
  onSkinTypeChange,
  onPriceChange,
  priceRange,
  selectedCategories = [],
  selectedSkinTypes = [],
}: CatalogueSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    skinType: true,
    price: false,
  });

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedCategories, categoryId]
      : selectedCategories.filter((id) => id !== categoryId);
    onCategoryChange(updated);
  };

  const handleSkinTypeChange = (skinTypeId: string, checked: boolean) => {
    const updated = checked
      ? [...selectedSkinTypes, skinTypeId]
      : selectedSkinTypes.filter((id) => id !== skinTypeId);
    onSkinTypeChange(updated);
  };

  const toggleSection = (section: 'category' | 'skinType' | 'price') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <aside className="border-r border-border-default p-5">
      {/* Category Filter */}
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
            {CATEGORIES.map((category) => (
              <label
                key={category.id}
                className="flex items-center gap-2 cursor-pointer group select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
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

      {/* Skin Type Filter */}
      <div className="mb-6 pb-6 border-b border-subtle">
        <button
          type="button"
          onClick={() => toggleSection('skinType')}
          className="text-ui-label text-text-primary font-jost font-medium mb-3 flex justify-between items-center w-full"
        >
          Skin type
          <span
            className={`text-brand-dark transition-transform ${expandedSections.skinType ? 'rotate-90' : ''}`}
          >
            ›
          </span>
        </button>

        {expandedSections.skinType && (
          <div className="space-y-2">
            {SKIN_TYPES.map((skinType) => (
              <label
                key={skinType.id}
                className="flex items-center gap-2 cursor-pointer group select-none"
              >
                <input
                  type="checkbox"
                  checked={selectedSkinTypes.includes(skinType.id)}
                  onChange={(e) => handleSkinTypeChange(skinType.id, e.target.checked)}
                  className="w-4 h-4 accent-text-primary cursor-pointer"
                />
                <span className="text-body-sm text-text-primary group-hover:text-text-primary">
                  {skinType.name}
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
            <input
              type="text"
              value={`€${priceRange[0]}`}
              onChange={(e) => {
                const val = Number(e.target.value.replace('€', '')) || 0;
                onPriceChange([val, priceRange[1]]);
              }}
              className="w-15 px-2 py-1.5 border border-border-default text-body-sm text-text-primary bg-page font-jost outline-none"
            />
            <span className="text-body-sm text-text-muted">—</span>
            <input
              type="text"
              value={`€${priceRange[1]}`}
              onChange={(e) => {
                const val = Number(e.target.value.replace('€', '')) || 0;
                onPriceChange([priceRange[0], val]);
              }}
              className="w-15 px-2 py-1.5 border border-border-default text-body-sm text-text-primary bg-page font-jost outline-none"
            />
          </div>
        )}
      </div>
    </aside>
  );
};
