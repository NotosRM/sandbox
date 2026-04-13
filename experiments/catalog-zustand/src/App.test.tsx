import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import App from './App';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App', () => {
  it('renders the Catalog header', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Catalog' })).toBeInTheDocument());
  });

  it('renders Cart button in header', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cart' })).toBeInTheDocument());
  });

  it('shows item count badge after adding to cart', async () => {
    const { useCartStore } = await import('@/features/cart/store');
    useCartStore.setState({
      items: [
        {
          product: {
            id: 1,
            title: 'T',
            description: '',
            category: '',
            price: 10,
            discountPercentage: 0,
            rating: 5,
            stock: 1,
            brand: '',
            thumbnail: '',
            images: [],
          },
          quantity: 3,
        },
      ],
      isCartOpen: false,
      totalItems: 3,
      totalPrice: 30,
    });
    render(<App />);
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
  });
});
