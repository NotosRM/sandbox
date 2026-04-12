# Design: catalog-zustand experiment

**Date:** 2026-04-12  
**Status:** Approved  
**Goal:** Compare state management approaches by building the same product catalog app three times — starting with Zustand + TanStack Query as the reference implementation, then copying to Reatom and Effector variants.

---

## Overview

A mini product catalog SPA built on the `react-full` template. Uses DummyJSON as a public REST API (no backend needed). Covers server state (TanStack Query), client state (Zustand), routing, CRUD with optimistic updates, and cart persistence.

The experiment is intentionally split into **3 iterations**, each delivering a working result and building on the previous one. Later, `catalog-reatom` and `catalog-effector` will be created by copying `catalog-zustand` and replacing only the state layer.

---

## Architecture

**Experiment name:** `catalog-zustand`  
**Template:** `react-full` (React 19, Vite, Tailwind CSS 4, shadcn/ui, Vitest, MSW)

**Additional dependencies:**

- `@tanstack/react-query` — server state
- `zustand` — client state (cart + UI flags)
- `react-router-dom` — routing
- `zod` — schema validation
- `react-hook-form` + `@hookform/resolvers` — product create/edit form

**API:** `https://dummyjson.com/products` — pagination, search, category filter, and CRUD responses out of the box. MSW is used only in tests for reproducibility.

**Responsibility split:**

- TanStack Query owns all server state (product list, detail, mutations)
- Zustand owns all client state (cart with persist, UI flags)

---

## Routing

React Router v6. Single `<Layout>` with header (logo + cart icon with item count badge) and `<Outlet>`.

| Route           | Component           | Description                       |
| --------------- | ------------------- | --------------------------------- |
| `/`             | redirect            | → `/products`                     |
| `/products`     | `ProductsPage`      | list, filters, search, pagination |
| `/products/:id` | `ProductDetailPage` | detail, edit/delete actions       |
| `/cart`         | `CartPage`          | cart contents, total, clear       |

Product detail is a full page navigation (not a modal) so routing is meaningfully exercised across all three variants.

---

## Folder structure

```
src/
  main.tsx
  App.tsx                    # Router, QueryClientProvider, Layout
  globals.css

  features/
    products/
      api.ts                 # TanStack Query hooks
      types.ts               # Product, Category types
      components/
        ProductCard.tsx
        ProductGrid.tsx
        ProductFilters.tsx   # search + category filter
        ProductForm.tsx      # create/edit, react-hook-form + zod
      ProductsPage.tsx
      ProductDetailPage.tsx

    cart/
      store.ts               # Zustand store with persist
      components/
        CartDrawer.tsx
        CartItem.tsx
      CartPage.tsx

  lib/
    queryClient.ts           # QueryClient config
    dummyjson.ts             # base fetch client (thin wrapper)

  mocks/
    handlers.ts              # MSW handlers for tests

  components/ui/             # shadcn components (from template)
```

---

## Data layer — TanStack Query

All query hooks live in `features/products/api.ts`:

```ts
useProducts({ page, limit, search, category }); // list + pagination
useCategories(); // category filter options
useProduct(id); // detail page
useCreateProduct(); // mutation
useUpdateProduct(); // mutation
useDeleteProduct(); // mutation + optimistic update
```

**Optimistic delete:** on delete, the product is immediately removed from the list via `setQueryData`. On error, the previous data is restored via rollback in `onError`.

**QueryClient config (`lib/queryClient.ts`):**

- `staleTime: 1000 * 60 * 5` — categories and details don't need frequent refetching
- `retry: 1` — one retry on error

**Invalidation:** after create and update, `['products']` query is invalidated so the list refreshes automatically.

---

## Client state — Zustand

**`features/cart/store.ts`** — cart store:

```ts
interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem(product: Product): void;
  removeItem(id: number): void;
  updateQuantity(id: number, qty: number): void;
  clearCart(): void;
  totalItems: number; // derived
  totalPrice: number; // derived
}
```

Persisted via `zustand/middleware/persist` to `localStorage` key `catalog-cart`. Cart survives page reloads.

**UI flags** (separate small store, not persisted):

```ts
interface UIStore {
  isCartOpen: boolean;
  toggleCart(): void;
  isProductFormOpen: boolean;
  editingProductId: number | null;
  openCreateForm(): void;
  openEditForm(id: number): void;
  closeForm(): void;
}
```

---

## Iterations

### Iteration 1 — Catalog (read-only)

- Experiment scaffolding: dependencies, router setup, QueryClientProvider
- `lib/dummyjson.ts` fetch client
- `useProducts`, `useCategories`, `useProduct` hooks
- `ProductsPage`: product grid, category filter, debounced search, pagination
- `ProductDetailPage`: product detail view, "Add to cart" button (stub)
- Layout with header

**Deliverable:** browsable, filterable, searchable product catalog. No mutations yet.

### Iteration 2 — CRUD

- `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct` mutations
- `ProductForm` with react-hook-form + zod validation (shared for create/edit)
- Edit/delete actions on detail page
- Optimistic delete in the list
- UI store for form open/close flags

**Deliverable:** full CRUD on products with optimistic UI.

### Iteration 3 — Cart

- Zustand cart store with `persist` middleware
- `CartDrawer` (opens from header) + `CartPage` at `/cart`
- "Add to cart" wired on product card and detail page
- Item count badge in header
- Quantity controls and remove in drawer/page

**Deliverable:** persistent shopping cart, completing the full state management picture.

---

## Testing approach

- Unit tests co-located with components (`*.test.tsx`)
- MSW handlers in `src/mocks/handlers.ts` mock DummyJSON responses
- Each iteration adds tests for its new features
- No E2E in this experiment (Vitest + MSW covers the meaningful cases)
