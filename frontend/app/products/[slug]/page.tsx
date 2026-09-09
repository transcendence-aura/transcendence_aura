'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { SizeSelector } from '@/components/product/SizeSelector';
import { WishlistToggle } from '@/components/product/WishlistToggle';
import { AccordionItem } from '@/components/ui/display/accordion';
import { PriceDisplay } from '@/components/ui/display/PriceDisplay';
import { Badge } from '@/components/ui/display/badge';
import { useToast } from '@/components/ui/feedback/toast';
import { ProductVariant } from '@/lib/graphql/queries/products';
import { useCart } from '@/lib/hooks/useCart';

// TODO: Replace with generated GraphQL types once product query is connected
interface ProductMock {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  category: { id: string; name: string; slug: string };
  badges: string[];
  rating: { average: number; count: number };
  variants: ProductVariant[];
  media: { id: string; url: string; altText: string; position: number }[];
  content: {
    description: string;
    keyIngredients: string;
    howToUse: string;
    shippingInfo: string;
  };
}

// TODO: Remove mock product data once GraphQL query is available
const MOCK_PRODUCT: ProductMock = {
  id: 'prod-1',
  slug: 'vitamin-c-serum',
  name: 'Vitamin C Serum',
  description: 'A lightweight Vitamin C serum that brightens and reduces dark spots.',
  shortDescription: 'Brightening serum with stable vitamin C complex.',
  category: { id: 'cat-1', name: 'Serums & Oils', slug: 'serums-oils' },
  badges: ['Bestseller'],
  rating: { average: 4.8, count: 214 },
  variants: [
    {
      id: 'var-1',
      label: '30ml',
      price: 64,
      isAvailable: true,
      isOnSale: false,
      discountPercentage: 0,
    },
    {
      id: 'var-2',
      label: '50ml',
      price: 92,
      isAvailable: true,
      isOnSale: false,
      discountPercentage: 0,
    },
    {
      id: 'var-3',
      label: '15ml',
      price: 48,
      isAvailable: false,
      isOnSale: false,
      discountPercentage: 0,
    },
  ],
  media: [
    {
      id: 'media-1',
      url: '/images/products/product-vitamin-c-serum.jpg',
      altText: 'Vitamin C Serum',
      position: 0,
    },
  ],
  content: {
    description: 'A lightweight Vitamin C serum that brightens and reduces dark spots.',
    keyIngredients: '15% L-Ascorbic Acid, Hyaluronic Acid, Ferulic Acid, Vitamin E',
    howToUse: 'Apply 2-3 drops to clean, dry skin. Follow with moisturizer and sunscreen.',
    shippingInfo: 'Free shipping on orders over €60. Returns within 30 days.',
  },
};

export default function ProductPage() {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(MOCK_PRODUCT.variants[0]);
  const { toast } = useToast();
  const { addItem } = useCart();

  // TODO: Remove mock product data once GraphQL query is available
  const product = MOCK_PRODUCT;
  const productImage = product.media[0];

  // Calculate price per 100ml based on first variant volume
  const firstVariant = product.variants[0];
  const volumeMatch = firstVariant.label.match(/(\d+)/);
  const volume = volumeMatch ? parseInt(volumeMatch[1], 10) : 100;
  const pricePerUnit = (firstVariant.price / volume) * 100;

  const handleAddToCart = () => {
    addItem({
      id: `${product.id}-${selectedVariant.id}`,
      productId: product.id,
      productName: product.name,
      variantId: selectedVariant.id,
      variantLabel: selectedVariant.label,
      price: selectedVariant.price,
      quantity: 1,
      image: productImage?.url,
    });

    toast({
      message: `Added ${selectedVariant.label} to cart`,
      variant: 'success',
    });
  };

  return (
    <div className="bg-page min-h-screen">
      {/* Breadcrumb */}
      <nav className="px-6 py-4 text-body-sm text-text-muted border-b border-border-default">
        <Link href="/">Home</Link> /{' '}
        <Link href={`/catalogue?category=${product.category.slug}`}>{product.category.name}</Link> /{' '}
        <span className="text-text-primary">{product.name}</span>
      </nav>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 px-6 md:px-8 py-12 max-w-7xl mx-auto">
        {/* Gallery Section */}
        <div className="relative">
          {productImage && (
            <div className="relative aspect-square bg-subtle rounded overflow-hidden">
              {product.badges?.[0] && (
                <div className="absolute top-4 left-4 z-10">
                  <Badge>{product.badges[0]}</Badge>
                </div>
              )}
              <Image
                src={productImage.url}
                alt={productImage.altText || product.name}
                fill
                priority
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          {/* Title & Description */}
          <div className="pb-6 border-b border-border-default">
            <p className="text-ui-label text-text-muted mb-2 uppercase tracking-wide">
              {product.category.name}
            </p>
            <h1 className="font-cormorant text-5xl text-text-primary font-bold mb-3 leading-tight">
              {product.name}
            </h1>
            <p className="text-body-base text-text-muted mb-4">{product.shortDescription}</p>
            <div className="text-body-sm text-text-muted">
              {product.rating.average} ⭐ {product.rating.count} reviews
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <PriceDisplay
              price={selectedVariant.price}
              discountPercentage={selectedVariant.discountPercentage}
            />
            <p className="text-body-sm text-text-muted">€{pricePerUnit.toFixed(2)} per 100ml</p>
          </div>

          {/* Size Selector */}
          <SizeSelector variants={product.variants} onSelect={setSelectedVariant} />

          {/* Add to Bag & Wishlist */}
          <div className="flex gap-4">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-text-primary text-page py-3 font-medium text-body-base hover:opacity-90 flex items-center justify-center gap-2 transition-opacity cursor-pointer"
            >
              <ShoppingCart size={18} />
              ADD TO BAG
            </button>
            <WishlistToggle />
          </div>

          {/* Stock Info */}
          <p className="text-body-sm text-text-muted">✓ In stock — Free delivery over €60</p>

          {/* Accordions */}
          <div className="border-t border-border-default pt-6 space-y-0">
            <AccordionItem id="description" title="Description">
              <p className="text-body-sm text-text-primary">{product.content.description}</p>
            </AccordionItem>
            <AccordionItem id="ingredients" title="Key Ingredients">
              <p className="text-body-sm text-text-primary">{product.content.keyIngredients}</p>
            </AccordionItem>
            <AccordionItem id="usage" title="How to use">
              <p className="text-body-sm text-text-primary">{product.content.howToUse}</p>
            </AccordionItem>
            <AccordionItem id="shipping" title="Shipping & Returns">
              <p className="text-body-sm text-text-primary">{product.content.shippingInfo}</p>
            </AccordionItem>
          </div>
        </div>
      </div>
    </div>
  );
}
