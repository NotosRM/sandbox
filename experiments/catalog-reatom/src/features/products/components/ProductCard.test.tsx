import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/handlers';
import { cartItemsAtom } from '@/features/cart/atoms';

describe('ProductCard', () => {
  it('renders title and price', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders category', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('links to product detail page', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/products/1')).toBe(true);
  });

  it('Add to Cart button adds product to cart', async () => {
    const { frame } = renderWithReatom(<ProductCard product={mockProduct} />);
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    frame.run(() => {
      expect(cartItemsAtom()).toHaveLength(1);
      expect(cartItemsAtom()[0].product.id).toBe(mockProduct.id);
    });
  });

  it('Add to Cart button shows "In Cart" after adding', async () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(screen.getByRole('button', { name: /in cart/i })).toBeInTheDocument();
  });
});
