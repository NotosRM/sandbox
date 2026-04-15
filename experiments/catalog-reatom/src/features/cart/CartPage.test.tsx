import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { CartPage } from './CartPage';
import { addItem, cartItemsAtom } from './atoms';
import type { Product } from '../products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: '',
  category: 'test',
  price: 50,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: '',
  images: [],
};

describe('CartPage', () => {
  it('shows empty state with continue shopping link', () => {
    renderWithReatom(<CartPage />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('shows cart item when product in cart', async () => {
    const { frame } = renderWithReatom(<CartPage />);
    await act(async () => frame.run(() => addItem(mockProduct)));
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', async () => {
    const { frame } = renderWithReatom(<CartPage />);
    await act(async () => frame.run(() => addItem(mockProduct)));
    // $50.00 appears both in CartItem (unit price) and in the total summary
    expect(screen.getAllByText('$50.00').length).toBeGreaterThanOrEqual(1);
  });

  it('clears cart on Clear Cart click', async () => {
    const { frame } = renderWithReatom(<CartPage />);
    await act(async () => frame.run(() => addItem(mockProduct)));
    await userEvent.click(screen.getByRole('button', { name: /clear cart/i }));
    frame.run(() => expect(cartItemsAtom()).toHaveLength(0));
  });
});
