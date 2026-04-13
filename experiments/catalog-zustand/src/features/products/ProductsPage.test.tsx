import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { createTestWrapper } from '@/test-utils';
import { ProductsPage } from './ProductsPage';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ProductsPage', () => {
  it('renders page heading', () => {
    render(<ProductsPage />, { wrapper: createTestWrapper() });
    expect(screen.getByRole('heading', { name: 'Products' })).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<ProductsPage />, { wrapper: createTestWrapper() });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders product cards after fetch', async () => {
    render(<ProductsPage />, { wrapper: createTestWrapper() });
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows error message on failed fetch', async () => {
    server.use(...createHandlers('error'));
    render(<ProductsPage />, { wrapper: createTestWrapper() });
    await waitFor(() => expect(screen.getByText('Failed to load products.')).toBeInTheDocument());
  });
});
