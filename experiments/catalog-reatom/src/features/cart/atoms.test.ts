import { context } from '@reatom/core';
import {
  cartItemsAtom,
  totalItemsAtom,
  totalPriceAtom,
  isCartOpenAtom,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
} from './atoms';
import type { Product } from '../products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test',
  description: '',
  category: 'test',
  price: 10,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: '',
  images: [],
};

const mockProduct2: Product = { ...mockProduct, id: 2, price: 20 };

describe('cartItemsAtom defaults', () => {
  it('starts empty', () => {
    const frame = context.start();
    frame.run(() => {
      expect(cartItemsAtom()).toEqual([]);
    });
  });

  it('totalItemsAtom starts at 0', () => {
    const frame = context.start();
    frame.run(() => {
      expect(totalItemsAtom()).toBe(0);
    });
  });

  it('totalPriceAtom starts at 0', () => {
    const frame = context.start();
    frame.run(() => {
      expect(totalPriceAtom()).toBe(0);
    });
  });

  it('isCartOpenAtom starts false', () => {
    const frame = context.start();
    frame.run(() => {
      expect(isCartOpenAtom()).toBe(false);
    });
  });
});

describe('addItem', () => {
  it('adds product to cart', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      expect(cartItemsAtom()).toHaveLength(1);
      expect(cartItemsAtom()[0].product.id).toBe(1);
      expect(cartItemsAtom()[0].quantity).toBe(1);
    });
  });

  it('increments quantity if product already in cart', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      addItem(mockProduct);
      expect(cartItemsAtom()).toHaveLength(1);
      expect(cartItemsAtom()[0].quantity).toBe(2);
    });
  });

  it('updates totalItemsAtom', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      addItem(mockProduct2);
      expect(totalItemsAtom()).toBe(2);
    });
  });

  it('updates totalPriceAtom', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct); // $10
      addItem(mockProduct2); // $20
      expect(totalPriceAtom()).toBe(30);
    });
  });
});

describe('removeItem', () => {
  it('removes product from cart', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      removeItem(mockProduct.id);
      expect(cartItemsAtom()).toHaveLength(0);
    });
  });
});

describe('updateQuantity', () => {
  it('updates quantity of existing item', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      updateQuantity(mockProduct.id, 5);
      expect(cartItemsAtom()[0].quantity).toBe(5);
    });
  });

  it('removes item when quantity set to 0', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      updateQuantity(mockProduct.id, 0);
      expect(cartItemsAtom()).toHaveLength(0);
    });
  });
});

describe('clearCart', () => {
  it('empties the cart', () => {
    const frame = context.start();
    frame.run(() => {
      addItem(mockProduct);
      addItem(mockProduct2);
      clearCart();
      expect(cartItemsAtom()).toHaveLength(0);
      expect(totalItemsAtom()).toBe(0);
    });
  });
});

describe('isCartOpenAtom', () => {
  it('can be toggled', () => {
    const frame = context.start();
    frame.run(() => {
      isCartOpenAtom.set(true);
      expect(isCartOpenAtom()).toBe(true);
      isCartOpenAtom.set(false);
      expect(isCartOpenAtom()).toBe(false);
    });
  });
});
