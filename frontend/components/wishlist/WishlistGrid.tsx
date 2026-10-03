'use client';

import { useMutation } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { ProductCard } from '@/components/cards/ProductCard';
import { REMOVE_FROM_WISHLIST, GET_WISHLIST } from '@/lib/graphql/queries/wishlist';
import { useToast } from '@/components/ui/feedback/toast';

export type WishlistProduct = React.ComponentProps<typeof ProductCard>['product'];

interface WishlistGridProps {
  products: WishlistProduct[];
}

export function WishlistGrid({ products }: WishlistGridProps) {
  const { toast } = useToast();
  const t = useTranslations('Wishlist');

  const [removeWishlistItem] = useMutation(REMOVE_FROM_WISHLIST, {
    optimisticResponse: {
      removeWishlistItem: true,
    },
    onCompleted: () => {
      toast({
        message: t('removed'),
        variant: 'success',
      });
    },
    onError: () => {
      toast({
        message: t('removeFailed'),
        variant: 'error',
      });
    },
    update(cache, _, { variables }) {
      const existingData = cache.readQuery<{ wishlist: WishlistProduct[] }>({
        query: GET_WISHLIST,
      });

      if (existingData?.wishlist && variables?.input?.productId) {
        cache.writeQuery({
          query: GET_WISHLIST,
          data: {
            wishlist: existingData.wishlist.filter((prod) => prod.id !== variables.input.productId),
          },
        });
      }
    },
  });

  const handleRemove = (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeWishlistItem({
      variables: {
        input: { productId },
      },
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <div key={product.id} className="group relative">
          <ProductCard product={product} showWishlistButton={false} />

          <button
            type="button"
            onClick={(e) => handleRemove(e, product.id)}
            className="hover:bg-brand-accent absolute top-3 inset-e-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md transition-colors hover:text-white"
            aria-label={t('removeItem', { name: product.name })}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
