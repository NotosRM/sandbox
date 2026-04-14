# catalog-reatom Iteration 1 — Setup + Read-only Catalog

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `catalog-reatom` experiment with Reatom v1000; build a browsable, filterable, searchable product catalog with detail page — no mutations, no cart.

**Architecture:** Fresh `react-full` experiment. Non-state files copied from `catalog-zustand`. `computed` + `withAsyncData` for reactive data fetching (auto-refetches when filter atoms change). `reatomComponent` for all state-reading components. Filter state (page, search, category) lives in module-scoped atoms.

**Tech Stack:** `@reatom/core` (atom, computed, wrap, withAsyncData, withLocalStorage), `@reatom/react` (reatomComponent, reatomContext), react-router-dom v7, shadcn/ui, Vitest + RTL + MSW

---

## File Map

| File                                                       | Action        | Responsibility                                                   |
| ---------------------------------------------------------- | ------------- | ---------------------------------------------------------------- |
| `package.json`                                             | create/modify | Reatom deps, no tanstack/zustand/axios                           |
| `src/test-setup.ts`                                        | create        | jest-dom + MSW server lifecycle                                  |
| `src/test/server.ts`                                       | create        | MSW node server                                                  |
| `src/test/utils.tsx`                                       | create        | `renderWithReatom` helper                                        |
| `src/main.tsx`                                             | create        | `clearStack()` + `context.start()` + `reatomContext.Provider`    |
| `src/App.tsx`                                              | create        | Router (no QueryClientProvider)                                  |
| `src/components/Layout.tsx`                                | create        | Header + Outlet, stubbed cart badge                              |
| `src/lib/dummyjson.ts`                                     | copy          | Fetch client, unchanged                                          |
| `src/features/products/types.ts`                           | copy          | Product/Category types, unchanged                                |
| `src/mocks/handlers.ts`                                    | copy          | MSW handlers, unchanged                                          |
| `src/features/products/atoms.ts`                           | create        | Filter atoms + computed+withAsyncData for list/categories/detail |
| `src/features/products/atoms.test.ts`                      | create        | Unit tests for atom initial values + mutations                   |
| `src/features/products/components/ProductCard.tsx`         | create        | reatomComponent, Add to Cart stubbed                             |
| `src/features/products/components/ProductCard.test.tsx`    | create        | Renders title, price, link                                       |
| `src/features/products/components/ProductFilters.tsx`      | create        | reatomComponent, debounced search + category buttons             |
| `src/features/products/components/ProductFilters.test.tsx` | create        | Updates atoms on interaction                                     |
| `src/features/products/ProductsPage.tsx`                   | create        | reatomComponent, grid + pagination                               |
| `src/features/products/ProductsPage.test.tsx`              | create        | Shows products from MSW                                          |
| `src/features/products/ProductDetailPage.tsx`              | create        | reatomComponent, product detail view                             |
| `src/features/products/ProductDetailPage.test.tsx`         | create        | Shows product fields from MSW                                    |
| `src/features/cart/CartPage.tsx`                           | create        | Placeholder for route                                            |

---

### Task 1: Create experiment and configure dependencies

**Files:**

- Create: `experiments/catalog-reatom/package.json`

- [ ] **Step 1: Scaffold experiment from react-full template**

```bash
cd d:/Projects/sandbox-notosrm
pnpm run create -- --template react-full --name catalog-reatom
```

Expected: `experiments/catalog-reatom/` created with template files.

- [ ] **Step 2: Replace package.json**

Write `experiments/catalog-reatom/package.json`:

```json
{
  "name": "@sandbox/catalog-reatom",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  },
  "dependencies": {
    "@hookform/resolvers": "^4.1.3",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@reatom/core": "^1000.0.0",
    "@reatom/react": "^1000.0.0",
    "@sandbox/shared": "workspace:*",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.0.0",
    "lucide-react": "^0.400.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.56.0",
    "react-router-dom": "^7.5.0",
    "tailwind-merge": "^2.0.0",
    "zod": "^3.24.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "@vitejs/plugin-react": "^4.4.1",
    "msw": "^2.7.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.8.3",
    "vite": "^6.3.2",
    "vitest": "^3.0.0"
  },
  "sandbox": {
    "template": "react-full",
    "created": "2026-04-14"
  }
}
```

**Изменения vs v3:** убраны `@reatom/async` и `@reatom/persist-web-storage` (оба вошли в `@reatom/core`); `@reatom/npm-react` → `@reatom/react`.

- [ ] **Step 3: Copy vitest config and tsconfig from catalog-zustand**

```bash
cp experiments/catalog-zustand/vitest.config.ts experiments/catalog-reatom/vitest.config.ts
cp experiments/catalog-zustand/tsconfig.json experiments/catalog-reatom/tsconfig.json
cp experiments/catalog-zustand/vite.config.ts experiments/catalog-reatom/vite.config.ts
cp experiments/catalog-zustand/components.json experiments/catalog-reatom/components.json
cp experiments/catalog-zustand/index.html experiments/catalog-reatom/index.html
```

- [ ] **Step 4: Install**

```bash
cd d:/Projects/sandbox-notosrm
pnpm install
```

Expected: `catalog-reatom` workspace resolved, `@reatom/core` и `@reatom/react` установлены.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/package.json experiments/catalog-reatom/vitest.config.ts experiments/catalog-reatom/tsconfig.json experiments/catalog-reatom/vite.config.ts experiments/catalog-reatom/components.json experiments/catalog-reatom/index.html pnpm-lock.yaml
rtk git commit -m "feat(catalog-reatom): scaffold experiment with Reatom v1000 dependencies"
```

---

### Task 2: Copy non-state boilerplate

**Files:**

- Create: `src/lib/dummyjson.ts`, `src/features/products/types.ts`, `src/mocks/handlers.ts`, `src/components/ui/`, `src/globals.css`

- [ ] **Step 1: Copy source files**

```bash
cp experiments/catalog-zustand/src/lib/dummyjson.ts experiments/catalog-reatom/src/lib/dummyjson.ts
cp experiments/catalog-zustand/src/features/products/types.ts experiments/catalog-reatom/src/features/products/types.ts
cp experiments/catalog-zustand/src/mocks/handlers.ts experiments/catalog-reatom/src/mocks/handlers.ts
cp experiments/catalog-zustand/src/globals.css experiments/catalog-reatom/src/globals.css
cp -r experiments/catalog-zustand/src/components/ui experiments/catalog-reatom/src/components/
```

- [ ] **Step 2: Commit**

```bash
rtk git add experiments/catalog-reatom/src/
rtk git commit -m "feat(catalog-reatom): copy non-state boilerplate from catalog-zustand"
```

---

### Task 3: MSW test infrastructure

**Files:**

- Create: `src/test/server.ts`
- Create: `src/test-setup.ts`
- Create: `src/test/utils.tsx`

- [ ] **Step 1: Create MSW node server**

Create `experiments/catalog-reatom/src/test/server.ts`:

```ts
import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

export const server = setupServer(...handlers);
```

- [ ] **Step 2: Create test-setup.ts**

Create `experiments/catalog-reatom/src/test-setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { server } from './test/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- [ ] **Step 3: Create renderWithReatom helper**

Create `experiments/catalog-reatom/src/test/utils.tsx`:

```tsx
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { context, clearStack } from '@reatom/core';
import { reatomContext } from '@reatom/react';

clearStack(); // отключаем дефолтный неявный контекст для тестов

type Frame = ReturnType<typeof context.start>;

interface RenderResult extends ReturnType<typeof render> {
  frame: Frame;
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
  routePath?: string;
}

export function renderWithReatom(
  ui: React.ReactElement,
  { route = '/', routePath, ...options }: Options = {}
): RenderResult {
  const frame = context.start();
  const content = routePath ? (
    <Routes>
      <Route path={routePath} element={ui} />
    </Routes>
  ) : (
    ui
  );
  const result = render(
    <reatomContext.Provider value={frame}>
      <MemoryRouter initialEntries={[route]}>{content}</MemoryRouter>
    </reatomContext.Provider>,
    options
  );
  return { ...result, frame };
}
```

**Изменения vs v3:** `createCtx()` → `context.start()`, `ReatomContext` → `reatomContext` из `@reatom/react`, возвращается `frame` вместо `ctx`. Проверка атомного состояния в тестах теперь через `frame.run(() => expect(atom()).toBe(...))`.

- [ ] **Step 4: Commit**

```bash
rtk git add experiments/catalog-reatom/src/test/ experiments/catalog-reatom/src/test-setup.ts
rtk git commit -m "feat(catalog-reatom): add MSW test server and renderWithReatom helper"
```

---

### Task 4: main.tsx and App.tsx

**Files:**

- Create: `src/main.tsx`
- Create: `src/App.tsx`

- [ ] **Step 1: Write main.tsx**

Create `experiments/catalog-reatom/src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { context, clearStack, connectLogger } from '@reatom/core';
import { reatomContext } from '@reatom/react';
import './globals.css';
import App from './App';

clearStack(); // отключаем дефолтный неявный стек контекста
const rootFrame = context.start();

if (import.meta.env.DEV) {
  rootFrame.run(connectLogger);
}

if (import.meta.env.DEV) {
  const { setupMocks } = await import('@sandbox/shared/msw');
  const { handlers } = await import('./mocks/handlers');
  await setupMocks(handlers);
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <reatomContext.Provider value={rootFrame}>
      <App />
    </reatomContext.Provider>
  </StrictMode>
);
```

**Изменения vs v3:** `createCtx()` → `clearStack()` + `context.start()`, `ReatomContext` → `reatomContext`, добавлен `connectLogger` для DEV.

- [ ] **Step 2: Write App.tsx**

Create `experiments/catalog-reatom/src/App.tsx`:

```tsx
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
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
  return <RouterProvider router={router} />;
}
```

- [ ] **Step 3: Write Layout.tsx**

Create `experiments/catalog-reatom/src/components/Layout.tsx`:

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
          {/* Cart button wired with badge in Iteration 3 */}
          <Button variant="ghost" size="icon" className="relative" asChild>
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

- [ ] **Step 4: Commit**

```bash
rtk git add experiments/catalog-reatom/src/main.tsx experiments/catalog-reatom/src/App.tsx experiments/catalog-reatom/src/components/Layout.tsx
rtk git commit -m "feat(catalog-reatom): add main.tsx ctx setup, App router, Layout"
```

---

### Task 5: TDD — products atoms

**Files:**

- Create: `src/features/products/atoms.ts`
- Create: `src/features/products/atoms.test.ts`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/products/atoms.test.ts`:

```ts
import { context } from '@reatom/core';
import {
  pageAtom,
  searchAtom,
  categoryAtom,
  LIMIT,
  productsResource,
  categoriesResource,
  productIdAtom,
  productResource,
} from './atoms';

describe('filter atoms — defaults', () => {
  it('pageAtom defaults to 1', () => {
    const frame = context.start();
    frame.run(() => {
      expect(pageAtom()).toBe(1);
    });
  });

  it('searchAtom defaults to empty string', () => {
    const frame = context.start();
    frame.run(() => {
      expect(searchAtom()).toBe('');
    });
  });

  it('categoryAtom defaults to empty string', () => {
    const frame = context.start();
    frame.run(() => {
      expect(categoryAtom()).toBe('');
    });
  });

  it('LIMIT is 12', () => {
    expect(LIMIT).toBe(12);
  });
});

describe('filter atoms — updates', () => {
  it('pageAtom can be set', () => {
    const frame = context.start();
    frame.run(() => {
      pageAtom.set(5);
      expect(pageAtom()).toBe(5);
    });
  });

  it('searchAtom can be set', () => {
    const frame = context.start();
    frame.run(() => {
      searchAtom.set('phone');
      expect(searchAtom()).toBe('phone');
    });
  });

  it('categoryAtom can be set', () => {
    const frame = context.start();
    frame.run(() => {
      categoryAtom.set('electronics');
      expect(categoryAtom()).toBe('electronics');
    });
  });
});

describe('resource atoms — initial data', () => {
  it('productsResource.data() defaults to null', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productsResource.data()).toBeNull();
    });
  });

  it('categoriesResource.data() defaults to empty array', () => {
    const frame = context.start();
    frame.run(() => {
      expect(categoriesResource.data()).toEqual([]);
    });
  });

  it('productIdAtom defaults to 0', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productIdAtom()).toBe(0);
    });
  });

  it('productResource.data() defaults to null', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productResource.data()).toBeNull();
    });
  });
});
```

**Изменения vs v3:** `createCtx()` → `context.start()`, все операции в `frame.run()`, `ctx.get(atom)` → `atom()`, `atom(ctx, value)` → `atom.set(value)`, `resource.dataAtom` → `resource.data()`.

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/atoms.test.ts
```

Expected: FAIL — `./atoms` not found.

- [ ] **Step 3: Write atoms.ts**

Create `experiments/catalog-reatom/src/features/products/atoms.ts`:

```ts
import { atom, computed, wrap } from '@reatom/core';
import { withAsyncData } from '@reatom/core';
import { fetchProducts, fetchCategories, fetchProduct } from '@/lib/dummyjson';

export const LIMIT = 12;

// ─── Filter atoms ─────────────────────────────────────────────────────────────

export const pageAtom = atom(1, 'pageAtom');
export const searchAtom = atom('', 'searchAtom');
export const categoryAtom = atom('', 'categoryAtom');

// ─── Products list (reactive: re-fetches when any filter atom changes) ────────

export const productsResource = computed(async () => {
  const page = pageAtom();
  const search = searchAtom();
  const category = categoryAtom();
  return await wrap(fetchProducts({ page, limit: LIMIT, search, category }));
}, 'productsResource').extend(withAsyncData({ initState: null, status: true }));

// ─── Categories (fetched once, no deps) ──────────────────────────────────────

export const categoriesResource = computed(async () => {
  return await wrap(fetchCategories());
}, 'categoriesResource').extend(withAsyncData({ initState: [] }));

// ─── Product detail ───────────────────────────────────────────────────────────

export const productIdAtom = atom(0, 'productIdAtom');

export const productResource = computed(async () => {
  const id = productIdAtom();
  if (!id) return null;
  return await wrap(fetchProduct(id));
}, 'productResource').extend(withAsyncData({ initState: null, status: true }));
```

**Изменения vs v3:** `reatomResource(async (ctx) => { ctx.spy(atom) })` → `computed(async () => { atom() })`, `.pipe(withDataAtom(null), withErrorAtom(), withStatusesAtom())` → `.extend(withAsyncData({ initState: null, status: true }))`, все `await` обёрнуты в `wrap()`. Импорт `@reatom/async` убран — всё из `@reatom/core`.

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/atoms.test.ts
```

Expected: PASS — 11 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/atoms.ts experiments/catalog-reatom/src/features/products/atoms.test.ts
rtk git commit -m "feat(catalog-reatom): add product filter atoms and computed+withAsyncData resources"
```

---

### Task 6: TDD — ProductCard

**Files:**

- Create: `src/features/products/components/ProductCard.tsx`
- Create: `src/features/products/components/ProductCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/products/components/ProductCard.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import { renderWithReatom } from '@/test/utils';
import { ProductCard } from './ProductCard';
import { mockProduct } from '@/mocks/handlers';

describe('ProductCard', () => {
  it('renders title and price', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders category', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('links to product detail page', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    const links = screen.getAllByRole('link');
    expect(links.some((l) => l.getAttribute('href') === '/products/1')).toBe(true);
  });

  it('Add to Cart button is disabled in Iter 1', () => {
    renderWithReatom(<ProductCard product={mockProduct} />);
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: FAIL — `./ProductCard` not found.

- [ ] **Step 3: Write ProductCard**

Create `experiments/catalog-reatom/src/features/products/components/ProductCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import type { Product } from '../types';

export const ProductCard = reatomComponent<{ product: Product }>(
  ({ product }) => (
    <div className="rounded-lg border bg-card flex flex-col">
      <Link to={`/products/${product.id}`} className="block">
        <img
          src={product.thumbnail}
          alt={product.title}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      </Link>
      <div className="p-4 flex flex-col flex-1">
        <Link to={`/products/${product.id}`} className="hover:underline">
          <h3 className="font-semibold line-clamp-1">{product.title}</h3>
        </Link>
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2 flex-1">
          {product.description}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-bold">${product.price.toFixed(2)}</span>
          <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
        </div>
        {/* Add to Cart wired in Iteration 3 */}
        <Button size="sm" className="mt-3 w-full" disabled>
          Add to Cart
        </Button>
      </div>
    </div>
  ),
  'ProductCard'
);
```

**Изменения vs v3:** убран `ctx` из пропсов (`({ ctx: _ctx, product })` → `({ product })`), импорт из `@reatom/react` вместо `@reatom/npm-react`.

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/components/ProductCard.tsx experiments/catalog-reatom/src/features/products/components/ProductCard.test.tsx
rtk git commit -m "feat(catalog-reatom): add ProductCard reatomComponent"
```

---

### Task 7: TDD — ProductFilters

**Files:**

- Create: `src/features/products/components/ProductFilters.tsx`
- Create: `src/features/products/components/ProductFilters.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/products/components/ProductFilters.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductFilters.test.tsx
```

Expected: FAIL — `./ProductFilters` not found.

- [ ] **Step 3: Write ProductFilters**

Create `experiments/catalog-reatom/src/features/products/components/ProductFilters.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchAtom, categoryAtom, pageAtom, categoriesResource } from '../atoms';

export const ProductFilters = reatomComponent(() => {
  const category = categoryAtom();
  const categories = categoriesResource.data();
  const currentSearch = searchAtom();

  const [inputValue, setInputValue] = useState(currentSearch);

  // Debounce: write to searchAtom 400ms after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAtom.set(inputValue);
      pageAtom.set(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Sync input when searchAtom is cleared externally
  useEffect(() => {
    if (currentSearch === '') setInputValue('');
  }, [currentSearch]);

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
          onClick={wrap(() => {
            categoryAtom.set('');
            pageAtom.set(1);
          })}
        >
          All
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.slug}
            variant={category === cat.slug ? 'default' : 'outline'}
            size="sm"
            onClick={wrap(() => {
              categoryAtom.set(cat.slug);
              pageAtom.set(1);
            })}
          >
            {cat.name}
          </Button>
        ))}
      </div>
    </div>
  );
}, 'ProductFilters');
```

**Изменения vs v3:** `({ ctx })` → `()`, `ctx.spy(atom)` → `atom()`, `atom(ctx, value)` → `atom.set(value)`, onClick обёрнуты в `wrap()`. `useEffect` остаётся (стандартный React hook, работает в `reatomComponent`). Прямые сеттеры внутри `useEffect` не требуют `wrap()` т.к. работают в синхронном контексте таймера.

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductFilters.test.tsx
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/components/ProductFilters.tsx experiments/catalog-reatom/src/features/products/components/ProductFilters.test.tsx
rtk git commit -m "feat(catalog-reatom): add ProductFilters reatomComponent"
```

---

### Task 8: TDD — ProductsPage

**Files:**

- Create: `src/features/products/ProductsPage.tsx`
- Create: `src/features/products/ProductsPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/products/ProductsPage.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import { server } from '@/test/server';
import { createHandlers } from '@/mocks/handlers';
import { renderWithReatom } from '@/test/utils';
import { ProductsPage } from './ProductsPage';

describe('ProductsPage', () => {
  it('shows loading state initially', () => {
    renderWithReatom(<ProductsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows products after loading', async () => {
    renderWithReatom(<ProductsPage />);
    await waitFor(() => expect(screen.getByText('Test Product')).toBeInTheDocument());
  });

  it('shows error when API fails', async () => {
    server.use(...createHandlers('error'));
    renderWithReatom(<ProductsPage />);
    await waitFor(() => expect(screen.getByText(/failed to load/i)).toBeInTheDocument());
  });

  it('shows empty state when no products', async () => {
    server.use(
      ...[
        require('msw').http.get('https://dummyjson.com/products', () =>
          require('msw').HttpResponse.json({ products: [], total: 0, skip: 0, limit: 12 })
        ),
      ]
    );
    renderWithReatom(<ProductsPage />);
    await waitFor(() => expect(screen.getByText(/no products found/i)).toBeInTheDocument());
  });
});
```

**Note:** The empty state test uses inline MSW override. If dynamic require causes issues in ESM, replace with a static import approach or skip this test.

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: FAIL — `./ProductsPage` not found.

- [ ] **Step 3: Write ProductsPage**

Create `experiments/catalog-reatom/src/features/products/ProductsPage.tsx`:

```tsx
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { productsResource, pageAtom, LIMIT } from './atoms';

export const ProductsPage = reatomComponent(() => {
  const data = productsResource.data();
  const { isPending } = productsResource.status();
  const error = productsResource.error();
  const page = pageAtom();
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  if (error) {
    return <p className="text-destructive">Failed to load products.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {/* New Product button wired in Iteration 2 */}
      </div>
      <ProductFilters />
      {isPending && !data ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {!data?.products.length ? (
            <p className="text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={wrap(() => pageAtom.set(page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={wrap(() => pageAtom.set(page + 1))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}, 'ProductsPage');
```

**Изменения vs v3:** `({ ctx })` → `()`, `ctx.spy(productsResource.dataAtom)` → `productsResource.data()`, `ctx.spy(productsResource.statusesAtom)` → `productsResource.status()`, `ctx.spy(productsResource.errorAtom)` → `productsResource.error()`, `pageAtom(ctx, ...)` → `wrap(() => pageAtom.set(...))`.

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: PASS — 3–4 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/ProductsPage.tsx experiments/catalog-reatom/src/features/products/ProductsPage.test.tsx
rtk git commit -m "feat(catalog-reatom): add ProductsPage reatomComponent"
```

---

### Task 9: TDD — ProductDetailPage

**Files:**

- Create: `src/features/products/ProductDetailPage.tsx`
- Create: `src/features/products/ProductDetailPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/products/ProductDetailPage.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: FAIL — `./ProductDetailPage` not found.

- [ ] **Step 3: Write ProductDetailPage**

Create `experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx`:

```tsx
import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { productResource, productIdAtom } from './atoms';

export const ProductDetailPage = reatomComponent(() => {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id ?? 0);

  useEffect(() => {
    productIdAtom.set(productId);
    return () => {
      productIdAtom.set(0);
    };
  }, [productId]);

  const product = productResource.data();
  const { isPending } = productResource.status();
  const error = productResource.error();

  if (isPending && !product) return <p className="text-muted-foreground">Loading...</p>;
  if (error || !product) return <p className="text-destructive">Product not found.</p>;

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
                  className="w-20 h-20 rounded object-cover shrink-0"
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
          <div className="flex gap-2 mt-6">
            {/* Edit / Delete wired in Iteration 2 */}
            {/* Add to Cart wired in Iteration 3 */}
            <Button className="flex-1" disabled>
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}, 'ProductDetailPage');
```

**Изменения vs v3:** `({ ctx })` → `()`, `productIdAtom(ctx, productId)` → `productIdAtom.set(productId)`, `ctx.spy(productResource.dataAtom)` → `productResource.data()`, `ctx.spy(productResource.statusesAtom)` → `productResource.status()`, `ctx.spy(productResource.errorAtom)` → `productResource.error()`. `useEffect` без `ctx` в deps.

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx experiments/catalog-reatom/src/features/products/ProductDetailPage.test.tsx
rtk git commit -m "feat(catalog-reatom): add ProductDetailPage reatomComponent"
```

---

### Task 10: CartPage placeholder + full test run

**Files:**

- Create: `src/features/cart/CartPage.tsx`

- [ ] **Step 1: Write CartPage placeholder**

Create `experiments/catalog-reatom/src/features/cart/CartPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function CartPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-muted-foreground mb-4">Cart coming in Iteration 3.</p>
      <Button asChild>
        <Link to="/products">Continue shopping</Link>
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Run full test suite**

```bash
cd experiments/catalog-reatom && pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 3: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/cart/CartPage.tsx
rtk git commit -m "feat(catalog-reatom): iter1 complete — read-only catalog with Reatom v1000"
```
