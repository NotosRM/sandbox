import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { ProductDetailPage } from './ProductDetailPage';
import type { ReactNode } from 'react';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/products/1']}>
        <Routes>
          <Route path="/products/:id" element={children} />
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
});
