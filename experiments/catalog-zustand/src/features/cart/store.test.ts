import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './store';
import { mockProduct } from '@/mocks/handlers';

// Reset store before each test — clear localStorage and reset state
beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('useCartStore — cart items', () => {
  it('initial state: empty items', () => {
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('addItem: adds product with quantity 1', () => {
    useCartStore.getState().addItem(mockProduct);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe(mockProduct.id);
    expect(items[0].quantity).toBe(1);
  });

  it('addItem: increments quantity when same product added twice', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removeItem: removes a product by id', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().removeItem(mockProduct.id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updateQuantity: sets exact quantity', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity(mockProduct.id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('updateQuantity: removes item when quantity set to 0', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity(mockProduct.id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clearCart: empties all items', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('useCartStore — derived values', () => {
  it('totalItems: sum of all quantities', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().totalItems).toBe(2);
  });

  it('totalPrice: sum of price * quantity', () => {
    useCartStore.getState().addItem(mockProduct); // price 99.99
    useCartStore.getState().addItem(mockProduct); // qty becomes 2
    expect(useCartStore.getState().totalPrice).toBeCloseTo(199.98, 2);
  });
});

describe('useCartStore — drawer state', () => {
  it('initial state: drawer closed', () => {
    expect(useCartStore.getState().isCartOpen).toBe(false);
  });

  it('toggleCart: opens and closes', () => {
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isCartOpen).toBe(true);
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isCartOpen).toBe(false);
  });
});
