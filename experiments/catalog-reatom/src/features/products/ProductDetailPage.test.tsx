import { screen, waitFor } from '@testing-library/react';
import { renderWithReatom } from '@/test/utils';
import { ProductDetailPage } from './ProductDetailPage';

describe('ProductDetailPage', () => {
  it('shows loading initially', () => {
    renderWithReatom(<ProductDetailPage />, {
      route: '/products/1',
      routePath: '/products/:id',
    });
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows product title after loading', async () => {
    renderWithReatom(<ProductDetailPage />, {
      route: '/products/1',
      routePath: '/products/:id',
    });
    await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());
  });

  it('shows back to products link', async () => {
    renderWithReatom(<ProductDetailPage />, {
      route: '/products/1',
      routePath: '/products/:id',
    });
    await waitFor(() =>
      expect(screen.getByRole('link', { name: /back to products/i })).toBeInTheDocument()
    );
  });

  it('shows price', async () => {
    renderWithReatom(<ProductDetailPage />, {
      route: '/products/1',
      routePath: '/products/:id',
    });
    await waitFor(() => expect(screen.getByText('$99.99')).toBeInTheDocument());
  });
});
