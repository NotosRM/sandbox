import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers, mockProduct, mockCategories } from '@/mocks/handlers';
import { createTestWrapper } from '@/test-utils';
import { useProducts, useCategories, useProduct } from './api';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('useProducts', () => {
  it('fetches product list', async () => {
    const { result } = renderHook(() => useProducts({ page: 1, limit: 12 }), {
      wrapper: createTestWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.products[0].title).toBe(mockProduct.title);
    expect(result.current.data?.total).toBe(1);
  });

  it('enters error state on failed fetch', async () => {
    server.use(...createHandlers('error'));
    const { result } = renderHook(() => useProducts({ page: 1, limit: 12 }), {
      wrapper: createTestWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useCategories', () => {
  it('fetches category list', async () => {
    const { result } = renderHook(() => useCategories(), {
      wrapper: createTestWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockCategories);
  });
});

describe('useProduct', () => {
  it('fetches single product by id', async () => {
    const { result } = renderHook(() => useProduct(1), {
      wrapper: createTestWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(1);
    expect(result.current.data?.title).toBe(mockProduct.title);
  });

  it('stays idle when id is 0', () => {
    const { result } = renderHook(() => useProduct(0), {
      wrapper: createTestWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });
});
