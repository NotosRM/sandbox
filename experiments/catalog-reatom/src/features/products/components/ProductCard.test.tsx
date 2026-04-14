import { screen } from '@testing-library/react';
import { renderWithReatom } from '@/test/utils';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/handlers';

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

  it('Add to Cart button is disabled in Iter 1', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });
});
