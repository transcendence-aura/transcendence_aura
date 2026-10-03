'use client';

import { createContext, useContext, useState, type ReactNode, useCallback, useEffect } from 'react';
import { readCart, writeCart } from '@/lib/cart/cart-storage';

export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantLabel: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  // Starts empty on the server and on the client's first render too, so hydration never mismatches
  // (reading localStorage straight in the initializer would return real data on the client but not
  // the server, flashing/warning on any page that shows a cart count). The saved cart, if any,
  // loads right after via the effect below.
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readCart());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    // Skip the write until the initial read above has run - otherwise this fires first, with the
    // empty initial state, and briefly overwrites a real saved cart with `[]`.
    if (hasLoaded) writeCart(items);
  }, [items, hasLoaded]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = useCallback((newItem: CartItem) => {
    setItems((prev) => {
      const existing = prev.find(
        (item) => item.productId === newItem.productId && item.variantId === newItem.variantId,
      );

      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + newItem.quantity } : item,
        );
      }

      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(itemId);
        return;
      }

      setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, quantity } : item)));
    },
    [removeItem],
  );

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value: CartContextType = {
    items,
    itemCount,
    total,
    addItem,
    removeItem,
    updateQuantity,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
