import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { CartDrawer } from './CartDrawer';
import { isCartOpenAtom, addItem } from '../atoms';
import type { Product } from '@/features/products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: '',
  category: 'test',
  price: 99.99,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: '',
  images: [],
};

describe('CartDrawer', () => {
  it('is not visible when cart is closed', () => {
    renderWithReatom(<CartDrawer />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows empty cart message when open with no items', async () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    await act(async () => frame.run(() => isCartOpenAtom.set(true)));
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('shows cart item when product added', async () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    await act(async () =>
      frame.run(() => {
        addItem(mockProduct);
        isCartOpenAtom.set(true);
      })
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', async () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    await act(async () =>
      frame.run(() => {
        addItem(mockProduct);
        isCartOpenAtom.set(true);
      })
    );
    expect(screen.getAllByText('$99.99').length).toBeGreaterThan(0);
  });

  it('closes when sheet is dismissed', async () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    await act(async () => frame.run(() => isCartOpenAtom.set(true)));
    await userEvent.keyboard('{Escape}');
    frame.run(() => expect(isCartOpenAtom()).toBe(false));
  });
});
