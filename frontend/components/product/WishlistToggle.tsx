'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/feedback/toast';

interface WishlistToggleProps {
  // Not used yet - persistence (real add/remove) is a separate ticket. Threaded through now so
  // that ticket only has to wire the mutation, not chase down where a real product id comes from.
  productId: string;
  onToggle?: (isAdded: boolean) => void;
}

export const WishlistToggle = ({ productId: _productId, onToggle }: WishlistToggleProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const { toast } = useToast();

  const handleToggle = () => {
    const newState = !isInWishlist;
    setIsInWishlist(newState);
    onToggle?.(newState);

    if (newState) {
      toast({
        message: 'Added to wishlist',
        variant: 'success',
      });
    } else {
      toast({
        message: 'Removed from wishlist',
        variant: 'info',
      });
    }

    // TODO: Implement wishlist persistence via Apollo addToWishlist/removeFromWishlist mutations
  };

  return (
    <button
      onClick={handleToggle}
      className={`w-12 h-12 flex items-center justify-center border transition-colors ${
        isInWishlist
          ? 'bg-page border-status-error text-status-error'
          : 'bg-page border-border-default text-text-muted hover:border-status-error hover:text-status-error'
      }`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      aria-pressed={isInWishlist}
    >
      <span className="text-body-lg">{isInWishlist ? '♥' : '♡'}</span>
    </button>
  );
};
