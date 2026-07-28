import type { HTMLAttributes } from 'react';

type Variant = 'dark' | 'accent' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  dark: 'bg-brand-dark text-text-inverse',
  accent: 'bg-brand-accent text-text-inverse',
  muted: 'bg-page-secondary text-text-muted',
};

export const Badge = ({ variant = 'dark', className = '', children, ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);
