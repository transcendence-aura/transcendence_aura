'use client';

import { useState, type KeyboardEvent } from 'react';

export interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export const Tabs = ({ items, activeId, onChange, className = '' }: TabsProps) => {
  const [selectedId, setSelectedId] = useState(activeId || items[0]?.id);

  const currentId = activeId !== undefined ? activeId : selectedId;

  const handleSelect = (id: string) => {
    if (activeId === undefined) {
      setSelectedId(id);
    }
    onChange?.(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect(items[index].id);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      const nextIndex = (index + 1) % items.length;
      handleSelect(items[nextIndex].id);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      handleSelect(items[prevIndex].id);
    }
  };

  return (
    <div role="tablist" className={`border-default flex gap-8 border-b-[0.5px] ${className}`}>
      {items.map((tab, index) => {
        const isActive = tab.id === currentId;

        return (
          <span
            key={tab.id}
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleSelect(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`cursor-pointer pb-3 text-xs font-medium uppercase tracking-wider transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-border-focus ${
              isActive
                ? 'border-brand-dark text-text-primary border-b-2 font-semibold'
                : 'text-text-muted hover:text-text-primary border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </span>
        );
      })}
    </div>
  );
};
