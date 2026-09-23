'use client';

import { forwardRef, type HTMLAttributes, type MouseEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Heart } from 'lucide-react';
import { PriceDisplay } from '@/components/ui/display/PriceDisplay';
import { useCart } from '@/lib/hooks/useCart';
import { useToast } from '@/components/ui/feedback/toast';
import { isLocalMediaUrl } from '@/lib/media/image-url';

interface ProductMedia {
  id: string;
  url: string;
  altText?: string | null;
  position: number;
}

interface ProductVariant {
  id: string;
  label: string;
  isAvailable: boolean;
  price: number;
  isOnSale: boolean;
  discountPercentage: number;
}

export interface ProductCardProps extends HTMLAttributes<HTMLDivElement> {
  product: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    media: ProductMedia[];
    variants: ProductVariant[];
    primaryImage?: ProductMedia;
    minPrice?: number;
    badges?: string[];
  };
  href?: string;
  isFavorite?: boolean;
  onToggleWishlist?: (productId: string) => void;
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  (
    {
      product,
      href = `/products/${product.slug}`,
      className = '',
      isFavorite = false,
      onToggleWishlist,
      ...props
    },
    ref,
  ) => {
    const { addItem } = useCart();
    const { toast } = useToast();
    const t = useTranslations('Catalogue');
    const tBadges = useTranslations('ProductBadges');

    const rawImage = product.primaryImage?.url || product.media?.[0]?.url;
    const imageUrl =
      rawImage && !rawImage.includes('curology') && !rawImage.includes('unsplash')
        ? rawImage
        : `/images/products/product-${product.slug}.jpg`;

    const lowestPriceVariant =
      product.variants && product.variants.length > 0
        ? product.variants.reduce((lowest, current) =>
            current.price < lowest.price ? current : lowest,
          )
        : {
            price: product.minPrice ?? 0,
            discountPercentage: 0,
            isAvailable: true,
            label: '',
            id: 'v-default',
          };

    const isAvailable = lowestPriceVariant.isAvailable ?? true;

    const handleAddToCart = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!isAvailable) {
        toast({
          message: t('unavailable'),
          variant: 'error',
        });
        return;
      }

      addItem({
        id: `${product.id}-${lowestPriceVariant.id}`,
        productId: product.id,
        productName: product.name,
        variantId: lowestPriceVariant.id,
        variantLabel: lowestPriceVariant.label,
        price: lowestPriceVariant.price,
        quantity: 1,
        image: imageUrl,
      });

      toast({
        message: t('addedToCart', { name: product.name }),
        variant: 'success',
      });
    };

    const handleWishlistClick = (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (onToggleWishlist) onToggleWishlist(product.id);
    };

    const cardContent = (
      <article
        ref={ref}
        className={`group cursor-pointer flex flex-col h-full outline-none transition-all duration-300 ${
          !isAvailable ? 'opacity-60 grayscale-35' : ''
        } ${className}`}
        {...props}
      >
        {/* Visual Container */}
        <div className="relative aspect-square overflow-hidden bg-page border border-border-default/60 transition-colors group-hover:border-border-focus">
          {/* Top Badges */}
          {!isAvailable ? (
            <span className="absolute start-2.5 top-2.5 z-10 bg-status-error px-2 py-0.5 text-ui-caption font-medium uppercase tracking-widest text-white">
              {t('soldOut')}
            </span>
          ) : product.badges && product.badges.length > 0 ? (
            <span className="absolute start-2.5 top-2.5 z-10 bg-brand-dark px-2 py-0.5 text-ui-caption font-medium uppercase tracking-widest text-white">
              {tBadges.has(product.badges[0]) ? tBadges(product.badges[0]) : product.badges[0]}
            </span>
          ) : null}

          {/* Floating Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlistClick}
            aria-label={t('addToWishlist')}
            className="absolute end-2.5 top-2.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/80 backdrop-blur-xs border border-border-default/40 text-text-muted transition-transform hover:scale-110 hover:text-text-primary cursor-pointer"
          >
            <Heart
              className={`h-3.5 w-3.5 transition-colors ${
                isFavorite ? 'fill-red-600 text-red-600' : ''
              }`}
            />
          </button>

          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized={isLocalMediaUrl(imageUrl)}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>

        {/* Product Information */}
        <div className="flex flex-col pt-3">
          <h3 className="text-body-base font-medium text-text-primary uppercase tracking-wider line-clamp-1">
            {product.name}
          </h3>

          {product.description && (
            <p className="mt-1 text-body-sm text-text-muted line-clamp-2 min-h-9 font-light">
              {product.description}
            </p>
          )}

          <div className="mt-2.5 flex items-baseline justify-between">
            <PriceDisplay
              price={lowestPriceVariant.price}
              discountPercentage={lowestPriceVariant.discountPercentage}
            />
            {product.variants && product.variants.length > 1 && (
              <span className="text-body-sm text-text-muted">
                {t('sizeCount', { count: product.variants.length })}
              </span>
            )}
          </div>
        </div>

        {/* Clean Balanced Action */}
        <div className="mt-4 pt-1">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="w-full border border-border-default bg-page py-2.5 text-body-sm font-medium uppercase tracking-widest text-text-primary transition-colors hover:border-brand-dark hover:bg-brand-dark hover:text-white disabled:opacity-40 disabled:hover:bg-page disabled:hover:text-text-primary disabled:cursor-not-allowed cursor-pointer"
          >
            {isAvailable ? t('addToBag') : t('soldOut')}
          </button>
        </div>
      </article>
    );

    if (href) {
      return (
        <Link href={href} className="block no-underline">
          {cardContent}
        </Link>
      );
    }

    return cardContent;
  },
);

ProductCard.displayName = 'ProductCard';
