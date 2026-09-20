'use client';

import { Link } from '@/i18n/navigation';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { useCart } from '@/lib/hooks/useCart';

interface RawCartItem {
  id?: string;
  variantId?: string;
  productId?: string;
  name?: string;
  productName?: string;
  title?: string;
  slug?: string;
  imageUrl?: string;
  image?: string;
  price?: number;
  size?: string;
  variantLabel?: string;
  quantity?: number;
  product?: {
    id?: string;
    name?: string;
    slug?: string;
    primaryImage?: { url?: string };
    media?: Array<{ url?: string }>;
  };
  variant?: {
    price?: number;
    label?: string;
  };
  primaryImage?: {
    url?: string;
  };
}

interface CartContextValue {
  items?: RawCartItem[];
  itemCount?: number;
  updateQuantity?: (id: string, quantity: number) => void;
  removeItem?: (id: string) => void;
  removeFromCart?: (id: string) => void;
}

function formatSlugToTitle(slug?: string): string {
  if (!slug) return 'Product';
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function CheckoutPage() {
  const cart = useCart() as unknown as CartContextValue;
  const rawItems: RawCartItem[] = cart?.items || [];
  const itemCount: number =
    cart?.itemCount ?? rawItems.reduce((acc, i) => acc + (i.quantity || 1), 0);

  if (itemCount === 0 || rawItems.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="text-h2 font-bold mb-4 text-text-primary">Your cart is empty</h1>
        <p className="text-body-base text-text-muted mb-8">
          Add some products to your ritual before proceeding to checkout.
        </p>
        <Link
          href="/catalogue"
          className="inline-block px-6 py-3 bg-brand-dark text-white rounded uppercase text-xs tracking-wider hover:bg-brand-dark/90 transition-colors"
        >
          Explore Catalogue
        </Link>
      </div>
    );
  }

  const items = rawItems.map((item: RawCartItem, idx: number) => {
    const slug = item.product?.slug || item.slug || '';
    const resolvedName =
      item.product?.name ||
      item.name ||
      item.productName ||
      item.title ||
      (slug ? formatSlugToTitle(slug) : 'Vitamin C Serum');

    return {
      id: item.id || item.variantId || `${item.productId || 'item'}-${idx}`,
      product: {
        id: item.productId || item.product?.id || item.id || `prod-${idx}`,
        name: resolvedName,
        slug,
        imageUrl:
          item.imageUrl ||
          item.image ||
          item.primaryImage?.url ||
          item.product?.primaryImage?.url ||
          item.product?.media?.[0]?.url ||
          '',
      },
      variant: {
        price: Number(item.price ?? item.variant?.price ?? 0),
        label: item.variantLabel || item.variant?.label || item.size || '30ml',
      },
      quantity: Number(item.quantity || 1),
    };
  });

  const subtotal = items.reduce((acc, i) => acc + i.variant.price * i.quantity, 0);
  const shipping = subtotal >= 60 || subtotal === 0 ? 0 : 4.9;
  const total = Number((subtotal + shipping).toFixed(2));

  const handleUpdateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      if (cart.removeItem) cart.removeItem(id);
      else if (cart.removeFromCart) cart.removeFromCart(id);
    } else {
      cart.updateQuantity?.(id, qty);
    }
  };

  const handleRemoveItem = (id: string) => {
    if (cart.removeItem) cart.removeItem(id);
    else if (cart.removeFromCart) cart.removeFromCart(id);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-8">
      <h1 className="text-h2 font-bold mb-8 text-text-primary">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <OrderSummary
            items={items}
            subtotal={subtotal}
            shipping={shipping}
            total={total}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
          />
        </div>

        <div className="bg-card border-border-default rounded-lg border p-6">
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
