import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { createTestWrapper } from '@/test-utils';
import { useUIStore } from '@/features/ui/store';
import { ProductForm } from './ProductForm';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  useUIStore.setState({ isProductFormOpen: false, editingProductId: null });
});

describe('ProductForm', () => {
  it('does not render dialog content when form is closed', () => {
    render(<ProductForm />, { wrapper: createTestWrapper() });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders create form when isProductFormOpen is true and editingProductId is null', () => {
    useUIStore.setState({ isProductFormOpen: true, editingProductId: null });
    render(<ProductForm />, { wrapper: createTestWrapper() });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('shows validation error when title is empty on submit', async () => {
    useUIStore.setState({ isProductFormOpen: true, editingProductId: null });
    render(<ProductForm />, { wrapper: createTestWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Title is required')).toBeInTheDocument());
  });

  it('calls create mutation and closes form on valid submit', async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isProductFormOpen: true, editingProductId: null });
    render(<ProductForm />, { wrapper: createTestWrapper() });

    await user.type(screen.getByLabelText('Title'), 'New Gadget');
    await user.type(screen.getByLabelText('Description'), 'A cool gadget');
    await user.type(screen.getByLabelText('Price'), '49.99');
    await user.type(screen.getByLabelText('Category'), 'electronics');
    await user.type(screen.getByLabelText('Brand'), 'Acme');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(useUIStore.getState().isProductFormOpen).toBe(false));
  });
});
