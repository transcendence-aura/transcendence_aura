import type { HTMLAttributes } from 'react';

type Variant = 'dark' | 'accent' | 'muted';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

const VARIANTS: Record<Variant, string> = {
  dark: 'bg-brand-dark text-text-inverse',
  accent: 'bg-brand-accent text-text-inverse',
  muted: 'bg-subtle text-text-muted',
};

export const Badge = ({ variant = 'dark', className = '', children, ...props }: BadgeProps) => (
  <span
    className={`inline-flex items-center rounded-pill px-3 py-1 text-ui-badge font-medium ${VARIANTS[variant]} ${className}`}
    {...props}
  >
    {children}
  </span>
);
