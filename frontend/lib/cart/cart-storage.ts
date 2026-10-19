import type { CartItem } from '@/lib/hooks/useCart';

// Client-side only: there is no backend cart. Survives a page reload, not a change of browser or
// device - if that's ever needed, this becomes a real backend-tracked cart instead.
const STORAGE_KEY = 'aura-cart';

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.productId === 'string' &&
    typeof item.productName === 'string' &&
    typeof item.variantId === 'string' &&
    typeof item.variantLabel === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    (item.image === undefined || typeof item.image === 'string')
  );
}

export function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode, quota): the cart still works for this tab, it just
    // won't survive a reload.
  }
}
