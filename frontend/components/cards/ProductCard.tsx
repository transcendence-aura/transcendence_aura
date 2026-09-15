'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PriceDisplay } from '@/components/ui/display/PriceDisplay';
import { Badge } from '@/components/ui/display/badge';

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

interface ProductCardProps extends HTMLAttributes<HTMLDivElement> {
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
}

export const ProductCard = forwardRef<HTMLDivElement, ProductCardProps>(
  ({ product, href = `/products/${product.slug}`, className = '', ...props }, ref) => {
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
        : { price: product.minPrice ?? 0, discountPercentage: 0 };

    const cardContent = (
      <article
        ref={ref}
        className={`group cursor-pointer flex flex-col h-full space-y-3 outline-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus ${className}`}
        {...props}
      >
        <div className="relative aspect-square overflow-hidden bg-page rounded-none border border-border-default">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <h3 className="text-body-base font-medium text-text-primary uppercase tracking-wide line-clamp-2 h-10">
          {product.name}
        </h3>

        {product.description && (
          <p className="text-body-sm text-text-muted line-clamp-2 h-10">{product.description}</p>
        )}

        <div className="pt-2">
          <PriceDisplay
            price={lowestPriceVariant.price}
            discountPercentage={lowestPriceVariant.discountPercentage}
          />
          {product.variants && product.variants.length > 1 && (
            <p className="text-body-sm text-text-muted mt-1">
              {product.variants.length} sizes available
            </p>
          )}
        </div>

        <div className="mt-auto pt-2">
          <Badge variant="dark">View Product</Badge>
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
