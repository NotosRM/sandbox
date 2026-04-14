import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { ProductForm } from './ProductForm';
import { isProductFormOpenAtom, openCreateForm, openEditForm } from '../atoms';

describe('ProductForm', () => {
  it('is not visible when form is closed', () => {
    renderWithReatom(<ProductForm />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows "New Product" title in create mode', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    await act(async () => {
      frame.run(() => openCreateForm());
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('shows "Edit Product" title in edit mode', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    await act(async () => {
      frame.run(() => openEditForm(1));
    });
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    await act(async () => {
      frame.run(() => openCreateForm());
    });
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('closes form on Cancel click', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    await act(async () => {
      frame.run(() => openCreateForm());
    });
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    frame.run(() => expect(isProductFormOpenAtom()).toBe(false));
  });

  it('prefills form when editing product 1', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    await act(async () => {
      frame.run(() => openEditForm(1));
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });
});
