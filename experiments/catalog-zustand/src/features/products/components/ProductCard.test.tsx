import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/handlers';
import { useCartStore } from '@/features/cart/store';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false, totalItems: 0, totalPrice: 0 });
  localStorage.clear();
});

function renderCard() {
  return render(
    <MemoryRouter>
      <ProductCard product={mockProduct} />
    </MemoryRouter>
  );
}

describe('ProductCard', () => {
  it('renders title and formatted price', () => {
    renderCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders category', () => {
    renderCard();
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    renderCard();
    const links = screen.getAllByRole('link');
    links.forEach((link) => expect(link).toHaveAttribute('href', '/products/1'));
  });

  it('renders thumbnail with alt text', () => {
    renderCard();
    expect(screen.getByRole('img', { name: 'Test Product' })).toBeInTheDocument();
  });

  it('clicking Add to Cart adds product to cart store', () => {
    render(
      <MemoryRouter>
        <ProductCard product={mockProduct} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].product.id).toBe(mockProduct.id);
  });
});
