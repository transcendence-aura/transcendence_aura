import { useCart } from '@/lib/hooks/useCart';

interface CartDotProps {
  className?: string;
}

export const CartDot = ({ className = '' }: CartDotProps) => {
  const { itemCount } = useCart();

  if (itemCount === 0) {
    return null;
  }

  return (
    <span
      className={`bg-brand-accent text-white absolute -top-3 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-ui-label font-semibold ${className}`}
      aria-label={`${itemCount} item${itemCount !== 1 ? 's' : ''} in cart`}
    >
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  );
};
