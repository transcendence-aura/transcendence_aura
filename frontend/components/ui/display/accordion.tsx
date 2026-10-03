'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemProps {
  id: string;
  title: string;
  children: ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const AccordionItem = ({
  id,
  title,
  children,
  isOpen: externalIsOpen,
  onToggle,
  className = '',
}: AccordionItemProps) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleToggle = () => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(!internalIsOpen);
    }
    onToggle?.();
  };

  return (
    <div className={`border-border-default border-b ${className}`}>
      <button
        type="button"
        id={`accordion-header-${id}`}
        aria-expanded={isOpen}
        aria-controls={`accordion-panel-${id}`}
        onClick={handleToggle}
        className="flex w-full cursor-pointer items-center justify-between py-4 text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus"
      >
        <span className="text-body-base text-text-primary font-medium">{title}</span>
        <ChevronDown
          className={`text-text-muted h-4 w-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          id={`accordion-panel-${id}`}
          role="region"
          aria-labelledby={`accordion-header-${id}`}
          className="text-body-base text-text-secondary pb-4"
        >
          {children}
        </div>
      )}
    </div>
  );
};
