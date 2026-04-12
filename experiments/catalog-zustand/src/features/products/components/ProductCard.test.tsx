import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/handlers';

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
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/1');
  });

  it('renders thumbnail with alt text', () => {
    renderCard();
    expect(screen.getByRole('img', { name: 'Test Product' })).toBeInTheDocument();
  });
});
