import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { CartItem } from './CartItem';
import { cartItemsAtom, addItem } from '../atoms';
import type { CartItem as CartItemType } from '../atoms';
import type { Product } from '@/features/products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: '',
  category: 'test',
  price: 10,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: 'https://example.com/img.jpg',
  images: [],
};

const mockItem: CartItemType = { product: mockProduct, quantity: 2 };

describe('CartItem', () => {
  it('renders product title and price', () => {
    renderWithReatom(<CartItem item={mockItem} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('renders quantity input with current value', () => {
    renderWithReatom(<CartItem item={mockItem} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
  });

  it('calls updateQuantity when quantity changes', async () => {
    const { frame } = renderWithReatom(<CartItem item={mockItem} />);
    frame.run(() => {
      addItem(mockProduct);
      addItem(mockProduct); // qty = 2
    });
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '5');
    frame.run(() => expect(cartItemsAtom()[0].quantity).toBe(5));
  });

  it('calls removeItem when delete button is clicked', async () => {
    const { frame } = renderWithReatom(<CartItem item={mockItem} />);
    frame.run(() => addItem(mockProduct));
    await userEvent.click(screen.getByRole('button', { name: /remove test product/i }));
    frame.run(() => expect(cartItemsAtom()).toHaveLength(0));
  });
});
