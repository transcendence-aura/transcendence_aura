'use client';

import { useWishlist } from '@/lib/hooks/useWishlist';

interface WishlistToggleProps {
  productId: string;
  onToggle?: (isAdded: boolean) => void;
}

export const WishlistToggle = ({ productId, onToggle }: WishlistToggleProps) => {
  const { isInWishlist, toggle } = useWishlist();
  const inWishlist = isInWishlist(productId);

  const handleToggle = () => {
    toggle(productId);
    onToggle?.(!inWishlist);
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-12 h-12 flex items-center justify-center border transition-colors ${
        inWishlist
          ? 'bg-page border-status-error text-status-error'
          : 'bg-page border-border-default text-text-muted hover:border-status-error hover:text-status-error'
      }`}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={inWishlist}
    >
      <span className="text-body-lg">{inWishlist ? '♥' : '♡'}</span>
    </button>
  );
};
