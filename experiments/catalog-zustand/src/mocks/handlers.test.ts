import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from './handlers';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('handlers — success mode', () => {
  it('GET /products returns product list', async () => {
    const res = await fetch('https://dummyjson.com/products?limit=12&skip=0');
    const data = await res.json();
    expect(res.ok).toBe(true);
    expect(data.products).toHaveLength(1);
    expect(data.products[0].title).toBe('Test Product');
  });

  it('GET /products/categories returns categories', async () => {
    const res = await fetch('https://dummyjson.com/products/categories');
    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].slug).toBe('electronics');
  });

  it('GET /products/:id returns single product', async () => {
    const res = await fetch('https://dummyjson.com/products/1');
    const data = await res.json();
    expect(data.id).toBe(1);
    expect(data.title).toBe('Test Product');
  });
});

describe('handlers — error mode', () => {
  it('returns 500 for products endpoint', async () => {
    const errServer = createServer(...createHandlers('error'));
    errServer.listen({ onUnhandledRequest: 'bypass' });
    const res = await fetch('https://dummyjson.com/products?limit=12&skip=0');
    expect(res.status).toBe(500);
    errServer.close();
  });
});
