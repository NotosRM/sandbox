# catalog-zustand Iteration 1: Catalog (read-only) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browsable, filterable, searchable product catalog using DummyJSON API and TanStack Query — no mutations yet.

**Architecture:** React 19 + Vite + Tailwind + shadcn/ui on the react-full template. Routing via React Router v7. Server state via TanStack Query v5. DummyJSON (`https://dummyjson.com`) is the public API backend — no mock server needed in the browser. MSW intercepts the same URLs in Vitest.

**Tech Stack:** `@tanstack/react-query` v5, `react-router-dom` v7, Vitest, MSW 2, `@testing-library/react`

---

## File Map

| File                                                       | Action  | Purpose                                                 |
| ---------------------------------------------------------- | ------- | ------------------------------------------------------- |
| `experiments/catalog-zustand/`                             | Create  | Scaffold from react-full template                       |
| `package.json`                                             | Modify  | Add `@tanstack/react-query`, `react-router-dom`         |
| `src/features/products/types.ts`                           | Create  | Product, Category, ProductsResponse types               |
| `src/lib/dummyjson.ts`                                     | Create  | Thin fetch client for DummyJSON endpoints               |
| `src/lib/queryClient.ts`                                   | Create  | QueryClient singleton config                            |
| `src/mocks/handlers.ts`                                    | Replace | MSW handlers for DummyJSON (replaces PostList handlers) |
| `src/test-utils.tsx`                                       | Create  | createTestWrapper factory for tests                     |
| `src/features/products/api.ts`                             | Create  | useProducts, useCategories, useProduct + mutation hooks |
| `src/features/products/api.test.ts`                        | Create  | Hook tests via renderHook + MSW                         |
| `src/components/Layout.tsx`                                | Create  | Sticky header + Outlet shell                            |
| `src/features/products/ProductsPage.tsx`                   | Create  | Grid + filters + pagination                             |
| `src/features/products/ProductsPage.test.tsx`              | Create  | Loading / success / error integration tests             |
| `src/features/products/ProductDetailPage.tsx`              | Create  | Detail view + back link + Add to Cart stub              |
| `src/features/products/ProductDetailPage.test.tsx`         | Create  | Detail render tests                                     |
| `src/features/products/components/ProductCard.tsx`         | Create  | Card linking to detail page                             |
| `src/features/products/components/ProductCard.test.tsx`    | Create  | Render + link tests                                     |
| `src/features/products/components/ProductFilters.tsx`      | Create  | Debounced search + category buttons                     |
| `src/features/products/components/ProductFilters.test.tsx` | Create  | Debounce + category click tests                         |
| `src/features/cart/CartPage.tsx`                           | Create  | Placeholder (wired in Iteration 3)                      |
| `src/App.tsx`                                              | Replace | createBrowserRouter + QueryClientProvider               |
| `src/main.tsx`                                             | Replace | MSW setup adapted to new handlers export                |
| `README.md`                                                | Update  | Status + stack additions                                |

---

### Task 1: Scaffold experiment + add dependencies

**Files:**

- Create: `experiments/catalog-zustand/`
- Modify: `experiments/catalog-zustand/package.json`

- [ ] **Step 1: Create experiment from template**

```bash
cd d:/Projects/sandbox-notosrm
pnpm run create -- --template react-full --name catalog-zustand
```

Expected: `experiments/catalog-zustand/` created.

- [ ] **Step 2: Add dependencies to package.json**

Edit `experiments/catalog-zustand/package.json`. In the `"dependencies"` object add:

```json
"@tanstack/react-query": "^5.74.4",
"react-router-dom": "^7.5.0"
```

- [ ] **Step 3: Add shadcn Input component**

```bash
cd experiments/catalog-zustand
npx shadcn@latest add input
```

Expected: `src/components/ui/input.tsx` created.

- [ ] **Step 4: Install from monorepo root**

```bash
cd d:/Projects/sandbox-notosrm
pnpm install
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand
git commit -m "feat(catalog-zustand): scaffold experiment from react-full template"
```

---

### Task 2: Types + fetch client

**Files:**

- Create: `experiments/catalog-zustand/src/features/products/types.ts`
- Create: `experiments/catalog-zustand/src/lib/dummyjson.ts`

- [ ] **Step 1: Create types**

Create `experiments/catalog-zustand/src/features/products/types.ts`:

```typescript
export interface Product {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  thumbnail: string;
  images: string[];
}

export interface Category {
  slug: string;
  name: string;
  url: string;
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  skip: number;
  limit: number;
}
```

- [ ] **Step 2: Create fetch client**

Create `experiments/catalog-zustand/src/lib/dummyjson.ts`:

```typescript
import type { Product, ProductsResponse, Category } from '@/features/products/types';

const BASE_URL = 'https://dummyjson.com';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

export function fetchProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}): Promise<ProductsResponse> {
  const skip = (params.page - 1) * params.limit;
  const qs = `limit=${params.limit}&skip=${skip}`;

  if (params.search) {
    return apiFetch(`${BASE_URL}/products/search?q=${encodeURIComponent(params.search)}&${qs}`);
  }
  if (params.category) {
    return apiFetch(`${BASE_URL}/products/category/${encodeURIComponent(params.category)}?${qs}`);
  }
  return apiFetch(`${BASE_URL}/products?${qs}`);
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch(`${BASE_URL}/products/categories`);
}

export function fetchProduct(id: number): Promise<Product> {
  return apiFetch(`${BASE_URL}/products/${id}`);
}

export function createProduct(
  data: Omit<Product, 'id' | 'rating' | 'stock' | 'images'>
): Promise<Product> {
  return apiFetch(`${BASE_URL}/products/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function updateProduct(id: number, data: Partial<Omit<Product, 'id'>>): Promise<Product> {
  return apiFetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export function deleteProduct(
  id: number
): Promise<{ id: number; isDeleted: boolean; deletedOn: string }> {
  return apiFetch(`${BASE_URL}/products/${id}`, { method: 'DELETE' });
}
```

- [ ] **Step 3: Type-check**

```bash
cd experiments/catalog-zustand
pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/types.ts \
        experiments/catalog-zustand/src/lib/dummyjson.ts
git commit -m "feat(catalog-zustand): add Product types and DummyJSON fetch client"
```

---

### Task 3: QueryClient config

**Files:**

- Create: `experiments/catalog-zustand/src/lib/queryClient.ts`

- [ ] **Step 1: Create QueryClient**

Create `experiments/catalog-zustand/src/lib/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});
```

- [ ] **Step 2: Type-check**

```bash
cd experiments/catalog-zustand
pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/lib/queryClient.ts
git commit -m "feat(catalog-zustand): add TanStack QueryClient config"
```

---

### Task 4: MSW handlers for DummyJSON

**Files:**

- Replace: `experiments/catalog-zustand/src/mocks/handlers.ts`
- Create: `experiments/catalog-zustand/src/mocks/handlers.test.ts`

The template's `handlers.ts` intercepts `/api/posts`. Replace it with DummyJSON handlers.
`main.tsx` imports `handlers` (named export) — keep that export.

- [ ] **Step 1: Write failing test**

Create `experiments/catalog-zustand/src/mocks/handlers.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/mocks/handlers.test.ts
```

Expected: FAIL — `createHandlers` from old handlers doesn't match these expectations.

- [ ] **Step 3: Replace handlers.ts**

Replace `experiments/catalog-zustand/src/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';
import type { Product, ProductsResponse, Category } from '@/features/products/types';

export const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: 'A great test product for experiments.',
  category: 'electronics',
  price: 99.99,
  discountPercentage: 10,
  rating: 4.5,
  stock: 100,
  brand: 'TestBrand',
  thumbnail: 'https://cdn.dummyjson.com/products/images/1/thumbnail.webp',
  images: ['https://cdn.dummyjson.com/products/images/1/1.webp'],
};

export const mockCategories: Category[] = [
  {
    slug: 'electronics',
    name: 'Electronics',
    url: 'https://dummyjson.com/products/category/electronics',
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    url: 'https://dummyjson.com/products/category/beauty',
  },
];

export type ApiMode = 'success' | 'error';

export function createHandlers(mode: ApiMode = 'success') {
  if (mode === 'error') {
    return [
      http.get('https://dummyjson.com/products', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
      http.get('https://dummyjson.com/products/categories', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
      http.get('https://dummyjson.com/products/:id', () =>
        HttpResponse.json({ message: 'Server error' }, { status: 500 })
      ),
    ];
  }

  const listResponse: ProductsResponse = {
    products: [mockProduct],
    total: 1,
    skip: 0,
    limit: 12,
  };

  return [
    http.get('https://dummyjson.com/products', () => HttpResponse.json(listResponse)),
    http.get('https://dummyjson.com/products/search', () => HttpResponse.json(listResponse)),
    http.get('https://dummyjson.com/products/categories', () => HttpResponse.json(mockCategories)),
    http.get('https://dummyjson.com/products/category/:category', () =>
      HttpResponse.json(listResponse)
    ),
    http.get('https://dummyjson.com/products/:id', () => HttpResponse.json(mockProduct)),
    http.post('https://dummyjson.com/products/add', () =>
      HttpResponse.json({ ...mockProduct, id: 195 })
    ),
    http.put('https://dummyjson.com/products/:id', () => HttpResponse.json(mockProduct)),
    http.delete('https://dummyjson.com/products/:id', () =>
      HttpResponse.json({ id: 1, isDeleted: true, deletedOn: '2026-04-12T00:00:00.000Z' })
    ),
  ];
}

// Named export used by main.tsx for the browser dev worker
export const handlers = createHandlers('success');
```

- [ ] **Step 4: Run to verify it passes**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/mocks/handlers.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/mocks/handlers.ts \
        experiments/catalog-zustand/src/mocks/handlers.test.ts
git commit -m "feat(catalog-zustand): replace MSW handlers with DummyJSON interceptors"
```

---

### Task 5: test-utils helper

**Files:**

- Create: `experiments/catalog-zustand/src/test-utils.tsx`

- [ ] **Step 1: Create test-utils**

Create `experiments/catalog-zustand/src/test-utils.tsx`:

```tsx
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function createTestWrapper(initialPath = '/') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}
```

Note: `gcTime: 0` prevents stale data from leaking between tests when sharing query keys.

- [ ] **Step 2: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/test-utils.tsx
git commit -m "feat(catalog-zustand): add createTestWrapper test utility"
```

---

### Task 6: TanStack Query hooks

**Files:**

- Create: `experiments/catalog-zustand/src/features/products/api.ts`
- Create: `experiments/catalog-zustand/src/features/products/api.test.ts`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/products/api.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/api.test.ts
```

Expected: FAIL — `useProducts is not a function`.

- [ ] **Step 3: Implement hooks**

Create `experiments/catalog-zustand/src/features/products/api.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProducts,
  fetchCategories,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/lib/dummyjson';
import type { ProductsResponse } from './types';

export function useProducts(params: {
  page: number;
  limit: number;
  search?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => fetchProducts(params),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: Infinity,
  });
}

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProduct(id),
    enabled: id > 0,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateProduct>[1] }) =>
      updateProduct(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProduct,
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const snapshots = queryClient.getQueriesData<ProductsResponse>({
        queryKey: ['products'],
      });
      queryClient.setQueriesData<ProductsResponse>({ queryKey: ['products'] }, (old) => {
        if (!old) return old;
        return {
          ...old,
          products: old.products.filter((p) => p.id !== id),
          total: old.total - 1,
        };
      });
      return { snapshots };
    },
    onError: (_err, _id, context) => {
      context?.snapshots.forEach(([queryKey, snapshot]) => {
        queryClient.setQueryData(queryKey, snapshot);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/api.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/api.ts \
        experiments/catalog-zustand/src/features/products/api.test.ts
git commit -m "feat(catalog-zustand): add TanStack Query product hooks"
```

---

### Task 7: App routing + Layout

**Files:**

- Replace: `experiments/catalog-zustand/src/App.tsx`
- Replace: `experiments/catalog-zustand/src/main.tsx`
- Create: `experiments/catalog-zustand/src/components/Layout.tsx`
- Create: `experiments/catalog-zustand/src/features/products/ProductsPage.tsx` (placeholder)
- Create: `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx` (placeholder)
- Create: `experiments/catalog-zustand/src/features/cart/CartPage.tsx` (placeholder)

- [ ] **Step 1: Create placeholder pages**

Create `experiments/catalog-zustand/src/features/products/ProductsPage.tsx`:

```tsx
export function ProductsPage() {
  return <p>Products — coming in next step</p>;
}
```

Create `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`:

```tsx
export function ProductDetailPage() {
  return <p>Product Detail — coming in next step</p>;
}
```

Create `experiments/catalog-zustand/src/features/cart/CartPage.tsx`:

```tsx
export function CartPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cart</h1>
      <p className="text-muted-foreground">Cart is coming in Iteration 3.</p>
    </div>
  );
}
```

- [ ] **Step 2: Create Layout**

Create `experiments/catalog-zustand/src/components/Layout.tsx`:

```tsx
import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <Link to="/products" className="text-xl font-bold tracking-tight">
            Catalog
          </Link>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Replace App.tsx with router**

Replace `experiments/catalog-zustand/src/App.tsx`:

```tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Layout } from '@/components/Layout';
import { ProductsPage } from '@/features/products/ProductsPage';
import { ProductDetailPage } from '@/features/products/ProductDetailPage';
import { CartPage } from '@/features/cart/CartPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'cart', element: <CartPage /> },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 4: Replace main.tsx**

The template's `main.tsx` imports `handlers` — keep that pattern:

Replace `experiments/catalog-zustand/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import App from './App.tsx';

if (import.meta.env.DEV) {
  const { setupMocks } = await import('@sandbox/shared/msw');
  const { handlers } = await import('./mocks/handlers');
  await setupMocks(handlers);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 5: Write smoke test for App**

Create `experiments/catalog-zustand/src/App.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import App from './App';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('App', () => {
  it('renders the Catalog header', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Catalog' })).toBeInTheDocument());
  });

  it('renders Cart link in header', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByRole('link', { name: 'Cart' })).toBeInTheDocument());
  });
});
```

- [ ] **Step 6: Run smoke tests**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/App.test.tsx
```

Expected: 2 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/App.tsx \
        experiments/catalog-zustand/src/App.test.tsx \
        experiments/catalog-zustand/src/main.tsx \
        experiments/catalog-zustand/src/components/Layout.tsx \
        experiments/catalog-zustand/src/features/products/ProductsPage.tsx \
        experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx \
        experiments/catalog-zustand/src/features/cart/CartPage.tsx
git commit -m "feat(catalog-zustand): add router, layout, and placeholder pages"
```

---

### Task 8: ProductCard

**Files:**

- Create: `experiments/catalog-zustand/src/features/products/components/ProductCard.tsx`
- Create: `experiments/catalog-zustand/src/features/products/components/ProductCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/products/components/ProductCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/handlers';

function renderCard() {
  return render(
    <MemoryRouter>
      <ProductCard product={mockProduct} />
    </MemoryRouter>
  );
}

describe('ProductCard', () => {
  it('renders title and formatted price', () => {
    renderCard();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders category', () => {
    renderCard();
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('links to the product detail page', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/1');
  });

  it('renders thumbnail with alt text', () => {
    renderCard();
    expect(screen.getByRole('img', { name: 'Test Product' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Create ProductCard**

Create `experiments/catalog-zustand/src/features/products/components/ProductCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="block rounded-lg border p-4 hover:shadow-md transition-shadow bg-card"
    >
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-48 object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold line-clamp-1">{product.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold">${product.price.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
      </div>
    </Link>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/components/ProductCard.tsx \
        experiments/catalog-zustand/src/features/products/components/ProductCard.test.tsx
git commit -m "feat(catalog-zustand): add ProductCard component"
```

---

### Task 9: ProductFilters

**Files:**

- Create: `experiments/catalog-zustand/src/features/products/components/ProductFilters.tsx`
- Create: `experiments/catalog-zustand/src/features/products/components/ProductFilters.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/products/components/ProductFilters.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductFilters.test.tsx
```

Expected: FAIL — component doesn't exist.

- [ ] **Step 3: Create ProductFilters**

Create `experiments/catalog-zustand/src/features/products/components/ProductFilters.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useCategories } from '../api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ProductFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: ProductFiltersProps) {
  const [inputValue, setInputValue] = useState(search);
  const { data: categories } = useCategories();

  useEffect(() => {
    const timer = setTimeout(() => onSearchChange(inputValue), 400);
    return () => clearTimeout(timer);
  }, [inputValue, onSearchChange]);

  // Sync when parent clears the search (e.g. category change resets search)
  useEffect(() => {
    if (search === '') setInputValue('');
  }, [search]);

  return (
    <div className="flex flex-col gap-4 mb-6">
      <Input
        placeholder="Search products..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="max-w-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant={category === '' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('')}
        >
          All
        </Button>
        {categories?.map((cat) => (
          <Button
            key={cat.slug}
            variant={category === cat.slug ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCategoryChange(cat.slug)}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductFilters.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/components/ProductFilters.tsx \
        experiments/catalog-zustand/src/features/products/components/ProductFilters.test.tsx
git commit -m "feat(catalog-zustand): add ProductFilters with debounced search"
```

---

### Task 10: ProductsPage

**Files:**

- Replace: `experiments/catalog-zustand/src/features/products/ProductsPage.tsx`
- Create: `experiments/catalog-zustand/src/features/products/ProductsPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/products/ProductsPage.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: FAIL — placeholder doesn't match expectations.

- [ ] **Step 3: Implement ProductsPage**

Replace `experiments/catalog-zustand/src/features/products/ProductsPage.tsx`:

```tsx
import { useState } from 'react';
import { useProducts } from './api';
import { ProductCard } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { Button } from '@/components/ui/button';

const LIMIT = 12;

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading, isError } = useProducts({ page, limit: LIMIT, search, category });
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setPage(1);
  }

  if (isError) {
    return <p className="text-destructive">Failed to load products.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Products</h1>
      <ProductFilters
        search={search}
        onSearchChange={handleSearchChange}
        category={category}
        onCategoryChange={handleCategoryChange}
      />
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {data?.products.length === 0 ? (
            <p className="text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/ProductsPage.tsx \
        experiments/catalog-zustand/src/features/products/ProductsPage.test.tsx
git commit -m "feat(catalog-zustand): implement ProductsPage with grid, filters, and pagination"
```

---

### Task 11: ProductDetailPage

**Files:**

- Replace: `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`
- Create: `experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx`

`useParams` requires a `Route` context. Tests use an inline `Routes` + `Route` wrapper instead of `createTestWrapper`.

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx`:

```tsx
import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { ProductDetailPage } from './ProductDetailPage';
import type { ReactNode } from 'react';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/products/1']}>
        <Routes>
          <Route path="/products/:id" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProductDetailPage', () => {
  it('renders product title after loading', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Test Product' })).toBeInTheDocument()
    );
  });

  it('renders formatted price', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders back link to /products', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByRole('link', { name: /back to products/i })).toHaveAttribute(
      'href',
      '/products'
    );
  });

  it('renders Add to Cart button', async () => {
    render(<ProductDetailPage />, { wrapper: Wrapper });
    await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: FAIL — placeholder doesn't match.

- [ ] **Step 3: Implement ProductDetailPage**

Replace `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`:

```tsx
import { useParams, Link } from 'react-router-dom';
import { useProduct } from './api';
import { Button } from '@/components/ui/button';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(Number(id ?? 0));

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (isError || !product) return <p className="text-destructive">Product not found.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/products"
        className="text-sm text-muted-foreground hover:underline mb-6 block"
        aria-label="Back to products"
      >
        ← Back to products
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full rounded-lg object-cover aspect-square"
          />
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {product.images.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.title} ${i + 2}`}
                  className="w-20 h-20 rounded object-cover flex-shrink-0"
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {product.description}
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {product.discountPercentage > 0 && (
              <span className="text-sm text-green-600 font-medium">
                -{product.discountPercentage.toFixed(0)}%
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>
              Category: <span className="capitalize text-foreground">{product.category}</span>
            </p>
            <p>
              Brand: <span className="text-foreground">{product.brand}</span>
            </p>
            <p>In stock: {product.stock}</p>
            <p>Rating: {product.rating} / 5</p>
          </div>
          <Button className="w-full mt-6">Add to Cart</Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx \
        experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx
git commit -m "feat(catalog-zustand): implement ProductDetailPage"
```

---

### Task 12: Final verification + README

**Files:**

- Update: `experiments/catalog-zustand/README.md`

- [ ] **Step 1: Run full test suite**

```bash
cd experiments/catalog-zustand
pnpm test:run
```

Expected: All tests PASS, no failures.

- [ ] **Step 2: Type-check**

```bash
cd experiments/catalog-zustand
pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Start dev server and manually verify golden path**

```bash
cd experiments/catalog-zustand
pnpm dev
```

Open http://localhost:5173 and verify:

- Redirects to `/products`
- Real DummyJSON data loads (product grid appears)
- Category filter buttons appear and filter the grid
- Search input filters with ~400ms debounce
- Pagination appears and works (DummyJSON has 194 products)
- Clicking a card navigates to `/products/:id`
- Detail page shows image, title, price, description, brand, stock
- Back link returns to `/products`
- "Add to Cart" button is present (does nothing yet)
- Cart icon navigates to `/cart` placeholder

Stop the server with Ctrl+C.

- [ ] **Step 4: Update README**

Replace `experiments/catalog-zustand/README.md`:

````markdown
# catalog-zustand

|                 |                                                                                 |
| --------------- | ------------------------------------------------------------------------------- |
| **Template**    | react-full                                                                      |
| **Date**        | 2026-04-12                                                                      |
| **Status**      | In Progress — Iteration 1 complete                                              |
| **Goal**        | Reference implementation for state manager comparison: Zustand + TanStack Query |
| **Conclusions** | —                                                                               |

## Stack additions

- `@tanstack/react-query` v5 — server state (product list, detail, mutations)
- `react-router-dom` v7 — routing
- `zustand` — client state, added in Iteration 3

## Iterations

- **Iteration 1** ✅ — Read-only catalog: list, filters, debounced search, pagination, detail page
- **Iteration 2** — CRUD: create, edit, delete with optimistic updates
- **Iteration 3** — Cart: Zustand store + localStorage persist

## Running

```bash
pnpm dev        # http://localhost:5173
pnpm test:run   # all tests once
pnpm test       # watch mode
```
````

````

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/README.md
git commit -m "docs(catalog-zustand): update README after iteration 1"
````
