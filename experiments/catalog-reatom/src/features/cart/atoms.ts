import { atom, computed, action } from '@reatom/core';
import { withLocalStorage } from '@reatom/core';
import type { Product } from '../products/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Persisted cart items ─────────────────────────────────────────────────────

export const cartItemsAtom = atom<CartItem[]>([], 'cartItemsAtom').extend(
  withLocalStorage('catalog-cart')
);

// ─── Computed atoms ───────────────────────────────────────────────────────────

export const totalItemsAtom = computed(
  () => cartItemsAtom().reduce((sum, i) => sum + i.quantity, 0),
  'totalItemsAtom'
);

export const totalPriceAtom = computed(
  () => cartItemsAtom().reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  'totalPriceAtom'
);

// ─── UI flag ──────────────────────────────────────────────────────────────────

export const isCartOpenAtom = atom(false, 'isCartOpenAtom');

// ─── Actions ─────────────────────────────────────────────────────────────────

export const addItem = action((product: Product) => {
  cartItemsAtom.set((prev) => {
    const existing = prev.find((i) => i.product.id === product.id);
    if (existing) {
      return prev.map((i) =>
        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    }
    return [...prev, { product, quantity: 1 }];
  });
}, 'addItem');

export const removeItem = action((id: number) => {
  cartItemsAtom.set((prev) => prev.filter((i) => i.product.id !== id));
}, 'removeItem');

export const updateQuantity = action((id: number, qty: number) => {
  if (qty <= 0) {
    cartItemsAtom.set((prev) => prev.filter((i) => i.product.id !== id));
  } else {
    cartItemsAtom.set((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i))
    );
  }
}, 'updateQuantity');

export const clearCart = action(() => {
  cartItemsAtom.set([]);
}, 'clearCart');
