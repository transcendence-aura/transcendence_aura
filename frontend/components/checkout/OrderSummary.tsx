'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { isLocalMediaUrl } from '@/lib/media/image-url';

export interface CartItem {
  id: string;
  product: { id: string; name: string; slug: string; imageUrl?: string };
  variant: { price: number; label: string };
  quantity: number;
}

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  onUpdateQuantity?: (id: string, quantity: number) => void;
  onRemoveItem?: (id: string) => void;
}

export function OrderSummary({
  items,
  subtotal,
  shipping,
  total,
  onUpdateQuantity,
  onRemoveItem,
}: OrderSummaryProps) {
  return (
    <div className="bg-card border-border-default rounded-lg border p-6">
      <h2 className="text-h3 font-bold mb-6 text-text-primary">Order Summary</h2>

      {/* Items List */}
      <div className="divide-y divide-border-default border-b border-border-default mb-6">
        {items.map((item) => (
          <div key={item.id} className="py-4 first:pt-0 flex gap-4 items-center">
            {/* Image Thumbnail */}
            <div className="relative h-16 w-16 bg-card-subtle shrink-0 border border-border-default rounded overflow-hidden">
              {item.product.imageUrl ? (
                <Image
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  fill
                  sizes="64px"
                  unoptimized={isLocalMediaUrl(item.product.imageUrl)}
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-[10px] text-text-muted">
                  No image
                </div>
              )}
            </div>

            {/* Middle & Right Content */}
            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-text-primary font-medium text-body-base truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-text-muted text-xs mt-0.5">{item.variant.label}</p>
                </div>
                <span className="text-text-primary font-medium text-body-base shrink-0">
                  €{(item.variant.price * item.quantity).toFixed(2)}
                </span>
              </div>

              {/* Controls bar*/}
              <div className="flex items-center justify-between mt-3">
                <div className="inline-flex items-center border border-border-default rounded bg-bg-page">
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity - 1)}
                    className="h-6 w-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-card-subtle transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-text-primary select-none">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                    className="h-6 w-6 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-card-subtle transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem?.(item.id)}
                  className="text-text-muted hover:text-red-500 text-xs inline-flex items-center gap-1 transition-colors group cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5 text-text-muted group-hover:text-red-500 transition-colors" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals Section */}
      <div className="space-y-3 text-body-base">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span className="font-medium text-text-primary">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Shipping</span>
          <span className="font-medium text-text-primary">
            {shipping === 0 ? 'Free' : `€${shipping.toFixed(2)}`}
          </span>
        </div>
        <div className="flex justify-between text-xs text-text-muted">
          <span>Taxes included</span>
          <span>€{(subtotal * 0.2).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-h3 font-bold text-text-primary pt-3 border-t border-border-default">
          <span>Total</span>
          <span>€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
