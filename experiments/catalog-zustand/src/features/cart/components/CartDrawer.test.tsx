import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCartStore } from '../store';
import { mockProduct } from '@/mocks/handlers';
import { CartDrawer } from './CartDrawer';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('CartDrawer', () => {
  it('does not show content when closed', () => {
    render(<CartDrawer />);
    expect(screen.queryByText('Your Cart')).not.toBeInTheDocument();
  });

  it('shows cart content when open', () => {
    useCartStore.setState({ isCartOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
  });

  it('shows empty message when cart is open but empty', () => {
    useCartStore.setState({ isCartOpen: true, items: [] });
    render(<CartDrawer />);
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('renders cart items when cart has items', () => {
    useCartStore.setState({
      isCartOpen: true,
      items: [{ product: mockProduct, quantity: 1 }],
    });
    render(<CartDrawer />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', () => {
    useCartStore.setState({
      isCartOpen: true,
      items: [{ product: mockProduct, quantity: 2 }],
    });
    render(<CartDrawer />);
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });
});
