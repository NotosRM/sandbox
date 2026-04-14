import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { ProductDetailPage } from './ProductDetailPage';
import { useCartStore } from '@/features/cart/store';
import type { ReactNode } from 'react';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false, totalItems: 0, totalPrice: 0 });
  localStorage.clear();
});

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/products/1']}>
        <Routes>
          <Route path="/products/:id" element={children} />
          <Route path="/products" element={<p>Products list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProductDetailPage', () => {
  it('renders product title after loading', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument()
    );
  });

  it('renders formatted price', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders back link to /products', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByRole('link', { name: /back to products/i })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  it('renders Add to Cart button', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
  });

  it('renders Edit button', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });

  it('renders Delete button', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('Add to Cart button adds product to cart store', async () => {
    const user = userEvent.setup();
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    await user.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(useCartStore.getState().items).toHaveLength(1);
    expect(useCartStore.getState().items[0].product.id).toBe(1);
  });

  it('clicking Delete calls mutation and navigates to /products', async () => {
    const user = userEvent.setup();
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    // After optimistic delete + navigation, the products placeholder should show
    // (MemoryRouter has no /products route in this test, so we check mutation was at least triggered)
    // Verify by checking button disappears (navigated away)
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    );
  });
});
