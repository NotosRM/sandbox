import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { createTestWrapper } from '@/test-utils';
import { ProductFilters } from './ProductFilters';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductFilters', () => {
  it('renders search input', () => {
    render(
      <ProductFilters search="" onSearchChange={vi.fn()} category="" onCategoryChange={vi.fn()} />,
      { wrapper: createTestWrapper() }
    );
    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
  });

  it('renders All button and category buttons from API', async () => {
    render(
      <ProductFilters search="" onSearchChange={vi.fn()} category="" onCategoryChange={vi.fn()} />,
      { wrapper: createTestWrapper() }
    );
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Electronics' })).toBeInTheDocument()
    );
    expect(screen.getByRole('button', { name: 'Beauty' })).toBeInTheDocument();
  });

  it('calls onCategoryChange when a category button is clicked', async () => {
    const onCategoryChange = vi.fn();
    render(
      <ProductFilters
        search=""
        onSearchChange={vi.fn()}
        category=""
        onCategoryChange={onCategoryChange}
      />,
      { wrapper: createTestWrapper() }
    );
    await waitFor(() => screen.getByRole('button', { name: 'Electronics' }));
    fireEvent.click(screen.getByRole('button', { name: 'Electronics' }));
    expect(onCategoryChange).toHaveBeenCalledWith('electronics');
  });

  it('debounces search — calls onSearchChange after 400ms', async () => {
    vi.useFakeTimers();
    const onSearchChange = vi.fn();
    render(
      <ProductFilters
        search=""
        onSearchChange={onSearchChange}
        category=""
        onCategoryChange={vi.fn()}
      />,
      { wrapper: createTestWrapper() }
    );
    fireEvent.change(screen.getByPlaceholderText('Search products...'), {
      target: { value: 'phone' },
    });
    expect(onSearchChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(400);
    expect(onSearchChange).toHaveBeenCalledWith('phone');
    vi.useRealTimers();
  });
});
