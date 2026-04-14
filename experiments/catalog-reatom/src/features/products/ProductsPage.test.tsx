import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/server';
import { createHandlers } from '@/mocks/handlers';
import { renderWithReatom } from '@/test/utils';
import { ProductsPage } from './ProductsPage';

describe('ProductsPage', () => {
  it('shows loading state initially', () => {
    renderWithReatom(<ProductsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows products after loading', async () => {
    renderWithReatom(<ProductsPage />);
    await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());
  });

  it('shows error when API fails', async () => {
    server.use(...createHandlers('error'));
    renderWithReatom(<ProductsPage />);
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });

  it('shows empty state when no products', async () => {
    server.use(
      http.get('https://dummyjson.com/products', () =>
        HttpResponse.json({ products: [], total: 0, skip: 0, limit: 12 })
      )
    );
    renderWithReatom(<ProductsPage />);
    await waitFor(() => expect(screen.getByText(/no products found/i)).toBeInTheDocument());
  });
});
