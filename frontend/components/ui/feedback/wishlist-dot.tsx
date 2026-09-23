'use client';

import { useWishlist } from '@/lib/hooks/useWishlist';

interface WishlistDotProps {
  className?: string;
}

// Same look as CartDot, for the wishlist heart in the navbar. Empty (0, or signed out - the
// underlying query is skipped then, so the count is 0 either way) shows nothing, same as the cart.
export const WishlistDot = ({ className = '' }: WishlistDotProps) => {
  const { itemCount } = useWishlist();

  if (itemCount === 0) {
    return null;
  }

  return (
    <span
      className={`bg-brand-accent text-white absolute -top-3 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold ${className}`}
      aria-label={`${itemCount} item${itemCount !== 1 ? 's' : ''} in your wishlist`}
    >
      {itemCount > 99 ? '99+' : itemCount}
    </span>
  );
};
