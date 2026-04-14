import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { ProductFilters } from './ProductFilters';
import { searchAtom, categoryAtom, pageAtom } from '../atoms';
import { mockCategories } from '@/mocks/handlers';

describe('ProductFilters', () => {
  it('renders search input', () => {
    renderWithReatom(<ProductFilters />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('updates searchAtom after debounce', async () => {
    const { frame } = renderWithReatom(<ProductFilters />);
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByPlaceholderText(/search/i), 'phone');
    await waitFor(() => frame.run(() => expect(searchAtom()).toBe('phone')), { timeout: 1000 });
  });

  it('resets pageAtom to 1 when search changes', async () => {
    const { frame } = renderWithReatom(<ProductFilters />);
    frame.run(() => pageAtom.set(3));
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByPlaceholderText(/search/i), 'x');
    await waitFor(() => frame.run(() => expect(pageAtom()).toBe(1)), { timeout: 1000 });
  });

  it('shows category buttons from categoriesResource', async () => {
    renderWithReatom(<ProductFilters />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: mockCategories[0].name })).toBeInTheDocument();
    });
  });

  it('updates categoryAtom on category click', async () => {
    const { frame } = renderWithReatom(<ProductFilters />);
    await waitFor(() => screen.getByRole('button', { name: mockCategories[0].name }));
    await userEvent.click(screen.getByRole('button', { name: mockCategories[0].name }));
    frame.run(() => expect(categoryAtom()).toBe(mockCategories[0].slug));
  });
});
