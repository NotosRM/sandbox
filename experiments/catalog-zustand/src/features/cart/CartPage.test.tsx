import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCartStore } from './store';
import { mockProduct } from '@/mocks/handlers';
import { CartPage } from './CartPage';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false, totalItems: 0, totalPrice: 0 });
  localStorage.clear();
});

describe('CartPage', () => {
  it('renders page heading', () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Cart' })).toBeInTheDocument();
  });

  it('shows empty state when cart is empty', () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('renders cart items and total', () => {
    useCartStore.setState({
      items: [{ product: mockProduct, quantity: 2 }],
      totalItems: 2,
      totalPrice: 199.98,
    });
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });

  it('Clear Cart button empties the cart', () => {
    useCartStore.setState({
      items: [{ product: mockProduct, quantity: 1 }],
      totalItems: 1,
      totalPrice: 99.99,
    });
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear Cart' }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
