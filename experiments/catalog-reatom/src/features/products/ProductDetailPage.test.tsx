import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { ProductDetailPage } from './ProductDetailPage';
import { isProductFormOpenAtom, editingProductIdAtom } from './atoms';

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

  it('Edit button opens form with correct product ID', async () => {
    const { frame } = renderWithReatom(<ProductDetailPage />, {
      route: '/products/1',
      routePath: '/products/:id',
    });
    await waitFor(() => screen.getByRole('button', { name: /edit/i }));
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));
    frame.run(() => {
      expect(isProductFormOpenAtom()).toBe(true);
      expect(editingProductIdAtom()).toBe(1);
    });
  });

  it('Delete button exists and is enabled', async () => {
    renderWithReatom(<ProductDetailPage />, {
      route: '/products/1',
      routePath: '/products/:id',
    });
    await waitFor(() => screen.getByRole('button', { name: /delete/i }));
    expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled();
  });
});
