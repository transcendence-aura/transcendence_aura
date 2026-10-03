'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { use, useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { ShoppingCart } from 'lucide-react';
import { SizeSelector } from '@/components/product/SizeSelector';
import { WishlistToggle } from '@/components/product/WishlistToggle';
import { AccordionItem } from '@/components/ui/display/accordion';
import { PriceDisplay } from '@/components/ui/display/PriceDisplay';
import { Badge } from '@/components/ui/display/badge';
import { Button } from '@/components/ui/form/button';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { useToast } from '@/components/ui/feedback/toast';
import { getValidationErrorMessage } from '@/lib/graphql-error';
import { isLocalMediaUrl } from '@/lib/media/image-url';
import { useCart } from '@/lib/hooks/useCart';
import { PRODUCT_QUERY, type ProductQueryResponse } from '@/lib/graphql/queries/product';
import type { ProductVariant } from '@/lib/graphql/queries/products';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const { toast } = useToast();
  const { addItem } = useCart();
  const t = useTranslations('Product');
  const tBadges = useTranslations('ProductBadges');
  const tCatalogue = useTranslations('Catalogue');
  // The variant the shopper picked; falls back to the first one once the product loads.
  const [pickedVariant, setPickedVariant] = useState<ProductVariant | null>(null);

  const { data, loading, error, refetch } = useQuery<ProductQueryResponse>(PRODUCT_QUERY, {
    variables: { slug },
    fetchPolicy: 'cache-and-network',
  });

  if (loading) return <ProductPageSkeleton />;

  if (error) {
    const isNotFound = getValidationErrorMessage(error) === 'PRODUCT_NOT_FOUND';

    return (
      <div className="bg-page flex min-h-screen flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-body-base text-text-muted">
          {isNotFound ? "This product doesn't exist." : 'Failed to load this product.'}
        </p>
        {isNotFound ? (
          <Link
            href="/catalogue"
            className="text-ui-button border-border-default text-text-primary hover:bg-page border px-6 py-3 uppercase transition-colors"
          >
            Back to the catalogue
          </Link>
        ) : (
          <Button onClick={() => refetch()}>Try Again</Button>
        )}
      </div>
    );
  }

  const product = data!.product;
  const currentVariant = pickedVariant ?? product.variants[0];
  const productImage = product.primaryImage ?? product.media[0];
  const category = product.categories[0];

  const handleAddToCart = () => {
    if (!currentVariant) return;

    if (!currentVariant.isAvailable) {
      toast({
        message: 'This variant is currently unavailable',
        variant: 'error',
      });
      return;
    }

    addItem({
      id: `${product.id}-${currentVariant.id}`,
      productId: product.id,
      productName: product.name,
      variantId: currentVariant.id,
      variantLabel: currentVariant.label,
      price: currentVariant.price,
      quantity: 1,
      image: productImage?.url,
    });

    toast({
      message: t('addedToCart', { name: product.name, size: currentVariant.label }),
      variant: 'success',
    });
  };

  return (
    <div className="bg-page min-h-screen">
      {/* Breadcrumb */}
      <nav className="px-6 py-4 text-body-sm text-text-muted border-b border-border-default">
        <Link href="/">{t('home')}</Link> /{' '}
        <Link href={`/catalogue?category=${category?.slug ?? ''}`}>
          {category?.name ?? 'Catalogue'}
        </Link>{' '}
        / <span className="text-text-primary">{product.name}</span>
      </nav>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-6 md:px-8 py-12 max-w-7xl mx-auto">
        {/* Gallery Section */}
        <div className="relative">
          {productImage && (
            <div className="relative aspect-square bg-subtle rounded overflow-hidden">
              {product.badges[0] && (
                <div className="absolute top-4 start-4 z-10">
                  <Badge>
                    {tBadges.has(product.badges[0])
                      ? tBadges(product.badges[0])
                      : product.badges[0]}
                  </Badge>
                </div>
              )}
              <Image
                src={productImage.url}
                alt={productImage.altText || product.name}
                fill
                priority
                unoptimized={isLocalMediaUrl(productImage.url)}
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="pb-6 border-b border-border-default">
            {category && (
              <p className="text-ui-label text-text-muted mb-2 uppercase tracking-wide">
                {category.name}
              </p>
            )}
            <h1 className="font-cormorant text-display-hero text-text-primary font-bold mb-3 leading-tight">
              {product.name}
            </h1>
            {product.description && (
              <p className="text-body-base text-text-muted">{product.description}</p>
            )}
          </div>

          {/* Price */}
          {currentVariant && (
            <div className="space-y-1">
              <PriceDisplay
                price={currentVariant.price}
                discountPercentage={currentVariant.discountPercentage}
              />
            </div>
          )}

          {/* Size Selector */}
          <SizeSelector variants={product.variants} onSelect={setPickedVariant} />

          {/* Add to Bag & Wishlist */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!currentVariant?.isAvailable}
              className="flex-1 bg-text-primary text-page py-3 font-medium text-body-base uppercase hover:opacity-90 flex items-center justify-center gap-2 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingCart size={18} />
              {currentVariant?.isAvailable ? t('addToBag') : tCatalogue('soldOut')}
            </button>
            <WishlistToggle productId={product.id} />
          </div>

          {/* Stock Info */}
          <p className="text-body-sm text-text-muted">
            {currentVariant?.isAvailable ? t('stockNotice') : 'Currently sold out'}
          </p>

          {/* Accordions - only what the backend actually has: no key ingredients / how-to-use
              field exists on Product, so those sections were removed rather than left empty or
              filled with placeholder copy. */}
          <div className="border-t border-border-default pt-6 space-y-0">
            {product.description && (
              <AccordionItem id="description" title={t('description')}>
                <p className="text-body-sm text-text-primary">{product.description}</p>
              </AccordionItem>
            )}
            <AccordionItem id="shipping" title={t('shipping')}>
              <p className="text-body-sm text-text-primary">
                Free shipping on orders over €60. Returns within 30 days.
              </p>
            </AccordionItem>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductPageSkeleton() {
  return (
    <div className="bg-page min-h-screen">
      <div className="px-6 py-4 border-b border-border-default">
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-6 md:px-8 py-12 max-w-7xl mx-auto">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-6">
          <div className="space-y-3 pb-6 border-b border-border-default">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
