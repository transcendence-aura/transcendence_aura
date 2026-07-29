'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { LucideIcon } from 'lucide-react';

type Variant = 'default' | 'active' | 'disabled';

interface CategoryCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon;
  label: string;
  count?: number;
  variant?: Variant;
}

const VARIANT_STYLES: Record<Variant, string> = {
  default:
    'bg-page-secondary text-text-primary border-default hover:bg-page-tertiary transition-colors',
  active:
    'bg-brand-dark text-text-inverse border-brand-dark hover:bg-brand-dark/90 transition-colors',
  disabled: 'bg-page-secondary text-text-muted opacity-50 cursor-not-allowed',
};

export const CategoryCard = forwardRef<HTMLButtonElement, CategoryCardProps>(
  (
    {
      icon: Icon,
      label,
      count,
      variant = 'default',
      className = '',
      disabled = variant === 'disabled',
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        className={`inline-flex items-center gap-2 rounded-none border-[0.5px] px-3 py-2 text-xs font-medium uppercase tracking-wide outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${VARIANT_STYLES[variant]} ${className}`}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0" />}

        <span>{label}</span>

        {count !== undefined && (
          <span
            className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
              variant === 'active'
                ? 'bg-white/20 text-text-inverse'
                : 'bg-brand-accent/20 text-brand-accent'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  },
);

CategoryCard.displayName = 'CategoryCard';
