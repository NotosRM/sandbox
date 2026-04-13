import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/features/products/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  // Persisted
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  // Derived (recomputed on every items change)
  totalItems: number;
  totalPrice: number;
  // Not persisted (UI state)
  isCartOpen: boolean;
  toggleCart: () => void;
}

function computeDerived(items: CartItem[]) {
  return {
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  };
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      isCartOpen: false,
      totalItems: 0,
      totalPrice: 0,

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          const items = existing
            ? state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              )
            : [...state.items, { product, quantity: 1 }];
          return { items, ...computeDerived(items) };
        }),

      removeItem: (productId) =>
        set((state) => {
          const items = state.items.filter((i) => i.product.id !== productId);
          return { items, ...computeDerived(items) };
        }),

      updateQuantity: (productId, quantity) =>
        set((state) => {
          const items =
            quantity <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i));
          return { items, ...computeDerived(items) };
        }),

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    }),
    {
      name: 'catalog-cart',
      // Only persist cart items — not UI state
      partialize: (state) => ({ items: state.items }),
      // Recompute derived values when restoring from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          const derived = computeDerived(state.items);
          state.totalItems = derived.totalItems;
          state.totalPrice = derived.totalPrice;
        }
      },
    }
  )
);
