import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useCartStore } from '../store';
import { mockProduct } from '@/mocks/handlers';
import { CartItem } from './CartItem';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('CartItem', () => {
  it('renders product title and price', () => {
    render(<CartItem item={{ product: mockProduct, quantity: 2 }} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders current quantity', () => {
    render(<CartItem item={{ product: mockProduct, quantity: 3 }} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('calls updateQuantity when quantity input changes', () => {
    useCartStore.setState({ items: [{ product: mockProduct, quantity: 2 }] });
    render(<CartItem item={{ product: mockProduct, quantity: 2 }} />);
    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '5' } });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('calls removeItem when Remove button is clicked', () => {
    useCartStore.setState({ items: [{ product: mockProduct, quantity: 1 }] });
    render(<CartItem item={{ product: mockProduct, quantity: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
