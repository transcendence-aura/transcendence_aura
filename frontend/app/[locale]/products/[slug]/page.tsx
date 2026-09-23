'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState, use } from 'react';
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

// TODO: Remove CATALOG_PRODUCTS when GraphQL query GET_PRODUCT_BY_SLUG is connected
const CATALOG_PRODUCTS: Record<string, ProductMock> = {
  'vitamin-c-serum': {
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
        id: 'var-1-1',
        label: '30ml',
        price: 64,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
      {
        id: 'var-1-2',
        label: '50ml',
        price: 92,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
      {
        id: 'var-1-3',
        label: '15ml',
        price: 48,
        isAvailable: false,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
    media: [
      {
        id: 'm-1',
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
  },
  'rosehip-face-oil': {
    id: 'prod-2',
    slug: 'rosehip-face-oil',
    name: 'Rosehip Face Oil',
    description: 'Nourishing botanical face oil rich in essential fatty acids and antioxidants.',
    shortDescription: 'Nourishing oil with antioxidants.',
    category: { id: 'cat-1', name: 'Serums & Oils', slug: 'serums-oils' },
    badges: [],
    rating: { average: 4.9, count: 128 },
    variants: [
      {
        id: 'var-2-1',
        label: '30ml',
        price: 52,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
      {
        id: 'var-2-2',
        label: '50ml',
        price: 78,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
    media: [
      {
        id: 'm-2',
        url: '/images/products/product-rosehip-face-oil.jpg',
        altText: 'Rosehip Face Oil',
        position: 0,
      },
    ],
    content: {
      description: 'Cold-pressed organic rosehip seed oil that restores elasticity.',
      keyIngredients: '100% Organic Rosa Canina Seed Oil, Vitamin E',
      howToUse: 'Warm a few drops in hands and press gently onto clean skin.',
      shippingInfo: 'Free shipping on orders over €60. Returns within 30 days.',
    },
  },
  'barrier-repair-cream': {
    id: 'prod-3',
    slug: 'barrier-repair-cream',
    name: 'Barrier Repair Cream',
    description:
      'Deep repair moisturizer formulated with ceramides and soothing botanical extracts.',
    shortDescription: 'Deep repair moisturizer.',
    category: { id: 'cat-2', name: 'Creams', slug: 'creams' },
    badges: ['Save 15%'],
    rating: { average: 4.7, count: 96 },
    variants: [
      {
        id: 'var-3-1',
        label: '50ml',
        price: 40.8,
        isAvailable: true,
        isOnSale: true,
        discountPercentage: 15,
      },
      {
        id: 'var-3-2',
        label: '100ml',
        price: 68,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
    media: [
      {
        id: 'm-3',
        url: '/images/products/product-barrier-repair-cream.jpg',
        altText: 'Barrier Repair Cream',
        position: 0,
      },
    ],
    content: {
      description: 'Strengthens moisture barriers and calms irritation with plant lipids.',
      keyIngredients: 'Ceramide NP, Madecassoside, Squalane, Shea Butter',
      howToUse: 'Apply evenly over face and neck morning and evening.',
      shippingInfo: 'Free shipping on orders over €60. Returns within 30 days.',
    },
  },
};

function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const { toast } = useToast();
  const { addItem } = useCart();
  const t = useTranslations('Product');
  const tBadges = useTranslations('ProductBadges');

  // TODO: Replace fallback resolution with Apollo useQuery(GET_PRODUCT_BY_SLUG, { variables: { slug } })
  const product: ProductMock = CATALOG_PRODUCTS[slug] || {
    id: `prod-${slug}`,
    slug,
    name: formatSlugToTitle(slug),
    description: 'Botanical formulation designed for daily conscious rituals.',
    shortDescription: 'Natural active skincare formula.',
    category: { id: 'cat-default', name: 'Formulations', slug: 'catalogue' },
    badges: [],
    rating: { average: 4.8, count: 42 },
    variants: [
      {
        id: `var-${slug}-1`,
        label: '50ml',
        price: 48,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
      {
        id: `var-${slug}-2`,
        label: '100ml',
        price: 74,
        isAvailable: true,
        isOnSale: false,
        discountPercentage: 0,
      },
    ],
    media: [
      {
        id: `m-${slug}`,
        url: `/images/products/product-${slug}.jpg`,
        altText: formatSlugToTitle(slug),
        position: 0,
      },
    ],
    content: {
      description: 'Botanical formulation crafted with pure active ingredients.',
      keyIngredients: 'Botanical Extracts, Antioxidants, Hyaluronic Complex',
      howToUse: 'Apply gently to clean skin morning and evening.',
      shippingInfo: 'Free delivery over €60. 30-day satisfaction guarantee.',
    },
  };

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0]);
  const currentVariant = selectedVariant || product.variants[0];
  const productImage = product.media[0];

  // TODO: Trigger backend ADD_TO_CART GraphQL mutation instead of purely local state
  const handleAddToCart = () => {
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
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="pb-6 border-b border-border-default">
            <p className="text-ui-label text-text-muted mb-2 uppercase tracking-wide">
              {product.category.name}
            </p>
            <h1 className="font-cormorant text-display-hero text-text-primary font-bold mb-3 leading-tight">
              {product.name}
            </h1>
            <p className="text-body-base text-text-muted mb-4">{product.shortDescription}</p>
            <div className="text-body-sm text-text-muted">
              {product.rating.average} ⭐ {t('reviewCount', { count: product.rating.count })}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <PriceDisplay
              price={currentVariant.price}
              discountPercentage={currentVariant.discountPercentage}
            />
          </div>

          {/* Size Selector */}
          <SizeSelector variants={product.variants} onSelect={setSelectedVariant} />

          {/* Add to Bag & Wishlist */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 bg-text-primary text-page py-3 font-medium text-body-base uppercase hover:opacity-90 flex items-center justify-center gap-2 transition-opacity cursor-pointer"
            >
              <ShoppingCart size={18} />
              {t('addToBag')}
            </button>
            <WishlistToggle />
          </div>

          {/* Stock Info */}
          <p className="text-body-sm text-text-muted">{t('stockNotice')}</p>

          {/* Accordions */}
          <div className="border-t border-border-default pt-6 space-y-0">
            <AccordionItem id="description" title={t('description')}>
              <p className="text-body-sm text-text-primary">{product.content.description}</p>
            </AccordionItem>
            <AccordionItem id="ingredients" title={t('ingredients')}>
              <p className="text-body-sm text-text-primary">{product.content.keyIngredients}</p>
            </AccordionItem>
            <AccordionItem id="usage" title={t('howToUse')}>
              <p className="text-body-sm text-text-primary">{product.content.howToUse}</p>
            </AccordionItem>
            <AccordionItem id="shipping" title={t('shipping')}>
              <p className="text-body-sm text-text-primary">{product.content.shippingInfo}</p>
            </AccordionItem>
          </div>
        </div>
      </div>
    </div>
  );
}
