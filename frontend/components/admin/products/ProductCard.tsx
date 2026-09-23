import Image from 'next/image';
import { Pencil } from 'lucide-react';
import type { AdminProduct } from '@/lib/graphql/queries/admin-products';

function formatPrice(price: number | null): string {
  return price === null ? '—' : `€${price.toFixed(2)}`;
}

export function ProductCard({ product, onEdit }: { product: AdminProduct; onEdit: () => void }) {
  const isAvailable = product.variants.some((variant) => variant.isAvailable);
  const category = product.categories[0]?.name;

  return (
    <div className="border-border-default bg-card flex flex-col border">
      <div className="bg-page relative aspect-square">
        {!product.isActive && (
          <span className="bg-status-error absolute left-3 top-3 z-10 px-2 py-0.5 text-ui-label font-medium uppercase tracking-widest text-white">
            Inactive
          </span>
        )}
        {product.badges.length > 0 && (
          <span className="bg-brand-dark absolute bottom-3 left-3 z-10 px-2 py-0.5 text-ui-label font-medium uppercase tracking-widest text-white">
            {product.badges[0]}
          </span>
        )}
        {product.primaryImage ? (
          <Image
            src={product.primaryImage.url}
            alt={product.primaryImage.altText ?? product.name}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="text-text-muted flex h-full items-center justify-center text-body-sm">
            No image
          </div>
        )}

        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${product.name}`}
          className="bg-card border-border-default hover:bg-page absolute top-3 right-3 flex h-8 w-8 items-center justify-center border transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col gap-1 p-4">
        {category && (
          <p className="text-ui-label text-text-muted uppercase tracking-widest">{category}</p>
        )}
        <p className="text-body-base text-text-primary font-medium">{product.name}</p>
        <p className="text-body-sm text-text-secondary">{formatPrice(product.minPrice)}</p>
        <p className="text-body-sm text-text-muted">
          {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
        </p>
        <p className="text-body-sm text-text-muted mt-1 inline-flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-status-online' : 'bg-status-error'}`}
            aria-hidden="true"
          />
          {isAvailable ? 'Available' : 'Unavailable'}
        </p>
      </div>
    </div>
  );
}
