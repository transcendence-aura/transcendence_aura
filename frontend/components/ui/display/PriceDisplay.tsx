import type { HTMLAttributes } from 'react';

interface PriceDisplayProps extends HTMLAttributes<HTMLDivElement> {
  price: number;
  discountPercentage?: number;
  className?: string;
}

export const PriceDisplay = ({
  price,
  discountPercentage = 0,
  className = '',
  ...props
}: PriceDisplayProps) => {
  if (!discountPercentage || discountPercentage <= 0) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`} {...props}>
        <span className="text-body-base font-medium text-text-primary">€{price.toFixed(2)}</span>
      </div>
    );
  }

  const discountedPrice = price * (1 - discountPercentage / 100);

  return (
    <div className={`flex items-baseline gap-2 ${className}`} {...props}>
      <span className="text-body-base font-medium text-text-primary">
        €{discountedPrice.toFixed(2)}
      </span>
      <span className="text-body-sm text-text-muted line-through">€{price.toFixed(2)}</span>
      <span className="text-body-sm text-brand-accent font-medium">
        Save {Math.round(discountPercentage)}%
      </span>
    </div>
  );
};
