# Design: catalog-reatom experiment

**Date:** 2026-04-14  
**Status:** Approved  
**Goal:** Rebuild the same product catalog app from `catalog-zustand` using idiomatic Reatom v3 — replacing TanStack Query with `@reatom/async` and Zustand with `@reatom/core` atoms, while keeping React Router and the same folder structure.

---

## Overview

A direct Reatom v3 port of `catalog-zustand`. The experiment is built from scratch (not copied) using `catalog-zustand` as a reference, to avoid leftover Zustand/TanStack Query imports. Non-state files are copied as-is; the state layer is written fresh in idiomatic Reatom style.

The key comparison axis: how `reatomAsync` + `reatomComponent` differ in ergonomics and explicitness from `useQuery` + Zustand hooks.

---

## Architecture

**Experiment name:** `catalog-reatom`  
**Template:** `react-full` (React 19, Vite, Tailwind CSS 4, shadcn/ui, Vitest, MSW)

**State dependencies (replacing tanstack + zustand):**

- `@reatom/core` — atoms, actions, ctx
- `@reatom/async` — async atoms (`reatomAsync`, `withDataAtom`, `withErrorAtom`, `withStatusesAtom`)
- `@reatom/npm-react` — `useAtom`, `useAction`, `reatomComponent`
- `@reatom/persist-web-storage` — `withLocalStorage`

**Unchanged dependencies:**

- `react-router-dom` — routing (identical to catalog-zustand)
- `zod` — schema validation
- `react-hook-form` + `@hookform/resolvers` — product create/edit form

**API:** `https://dummyjson.com/products` — same as catalog-zustand. MSW for tests only.

---

## Files copied from catalog-zustand without changes

| File                         | Reason                               |
| ---------------------------- | ------------------------------------ |
| `lib/dummyjson.ts`           | Pure fetch client, no state          |
| `features/products/types.ts` | TypeScript types (Product, Category) |
| `components/ui/`             | shadcn components                    |
| `mocks/handlers.ts`          | MSW handlers                         |
| `App.tsx`                    | Router structure identical           |

Everything else is written from scratch.

---

## Routing

React Router v6, identical to catalog-zustand. Single `<Layout>` with header and `<Outlet>`.

| Route           | Component           | Description                       |
| --------------- | ------------------- | --------------------------------- |
| `/`             | redirect            | → `/products`                     |
| `/products`     | `ProductsPage`      | list, filters, search, pagination |
| `/products/:id` | `ProductDetailPage` | detail, edit/delete actions       |
| `/cart`         | `CartPage`          | cart contents, total, clear       |

`App.tsx` adds only `<ReatomContext.Provider value={ctx}>` around the router compared to the zustand version.

---

## Folder structure

```
src/
  main.tsx                   # ctx = createCtx(), ReatomContext.Provider
  App.tsx                    # Router + ReatomContext.Provider + Layout
  globals.css

  features/
    products/
      atoms.ts               # reatomAsync atoms + filter atoms + mutations
      types.ts               # Product, Category types (copied)
      components/
        ProductCard.tsx      # reatomComponent
        ProductGrid.tsx      # reatomComponent
        ProductFilters.tsx   # reatomComponent
        ProductForm.tsx      # react-hook-form + zod, submit → action
      ProductsPage.tsx       # reatomComponent
      ProductDetailPage.tsx  # reatomComponent

    cart/
      atoms.ts               # cartItemsAtom + withLocalStorage + actions
      components/
        CartDrawer.tsx       # reatomComponent
        CartItem.tsx         # reatomComponent
      CartPage.tsx           # reatomComponent

  lib/
    queryClient.ts           # removed — not needed
    dummyjson.ts             # base fetch client (copied)

  mocks/
    handlers.ts              # MSW handlers (copied)

  components/ui/             # shadcn components (copied)
```

---

## Data layer — `@reatom/async`

All async atoms live in `features/products/atoms.ts`.

**Filter atoms:**

```ts
export const pageAtom = atom(1, 'pageAtom');
export const searchAtom = atom('', 'searchAtom');
export const categoryAtom = atom('', 'categoryAtom');

// Derived: current params object used by mutations for re-fetch/invalidation
export const currentParamsAtom = atom(
  (ctx): ProductsParams => ({
    page: ctx.spy(pageAtom),
    search: ctx.spy(searchAtom),
    category: ctx.spy(categoryAtom),
  }),
  'currentParamsAtom'
);
```

**Async atoms:**

```ts
export const fetchProducts = reatomAsync(
  (ctx, params: ProductsParams) => dummyjson.getProducts(params),
  'fetchProducts'
).pipe(withDataAtom([]), withErrorAtom(), withStatusesAtom());

export const fetchCategories = reatomAsync(
  (ctx) => dummyjson.getCategories(),
  'fetchCategories'
).pipe(withDataAtom([]));

export const fetchProduct = reatomAsync(
  (ctx, id: number) => dummyjson.getProduct(id),
  'fetchProduct'
).pipe(withDataAtom(null), withErrorAtom());
```

Components call `fetchProducts(ctx, params)` directly — no separate query key system.

**Mutations as actions:**

```ts
export const createProduct = action(async (ctx, data: ProductFormData) => {
  const product = await dummyjson.create(data);
  // invalidate: re-fetch with current params
  await fetchProducts(ctx, ctx.get(currentParamsAtom));
});

export const updateProduct = action(async (ctx, id: number, data: ProductFormData) => {
  await dummyjson.update(id, data);
  await fetchProducts(ctx, ctx.get(currentParamsAtom));
  await fetchProduct(ctx, id);
});

export const deleteProduct = action(async (ctx, id: number) => {
  // optimistic: remove immediately from dataAtom
  fetchProducts.dataAtom(ctx, (prev) => prev.filter((p) => p.id !== id));
  try {
    await dummyjson.delete(id);
  } catch {
    // rollback: re-fetch
    await fetchProducts(ctx, ctx.get(currentParamsAtom));
  }
});
```

Optimistic delete is explicit — no query cache magic. Rollback is a re-fetch.

---

## Client state — Cart

**`features/cart/atoms.ts`:**

```ts
export const cartItemsAtom = atom<CartItem[]>([], 'cartItemsAtom').pipe(
  withLocalStorage('catalog-cart')
);

// Computed
export const totalItemsAtom = atom(
  (ctx) => ctx.spy(cartItemsAtom).reduce((sum, i) => sum + i.quantity, 0),
  'totalItemsAtom'
);
export const totalPriceAtom = atom(
  (ctx) => ctx.spy(cartItemsAtom).reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  'totalPriceAtom'
);

// Actions
export const addItem = action((ctx, product: Product) => {
  cartItemsAtom(ctx, (prev) => {
    const existing = prev.find((i) => i.product.id === product.id);
    if (existing)
      return prev.map((i) =>
        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    return [...prev, { product, quantity: 1 }];
  });
});
export const removeItem = action((ctx, id: number) =>
  cartItemsAtom(ctx, (prev) => prev.filter((i) => i.product.id !== id))
);
export const updateQuantity = action((ctx, id: number, qty: number) =>
  cartItemsAtom(ctx, (prev) => prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i)))
);
export const clearCart = action((ctx) => cartItemsAtom(ctx, []));
```

**UI flags:**

```ts
export const isCartOpenAtom = atom(false, 'isCartOpenAtom');
export const editingProductIdAtom = atom<number | null>(null, 'editingProductIdAtom');
export const isProductFormOpenAtom = atom(false, 'isProductFormOpenAtom');
```

---

## Components — `reatomComponent`

**Rule:** use `reatomComponent` when the component reads atoms. Use a plain component when it only receives props (shadcn wrappers, layout primitives).

```ts
// Reads cartItemsAtom — use reatomComponent
const ProductCard = reatomComponent(({ ctx, product }: { ctx: Ctx; product: Product }) => {
  const isInCart = ctx.spy(cartItemsAtom).some((i) => i.product.id === product.id)
  return (
    <Card>
      ...
      <Button onClick={() => addItem(ctx, product)}>
        {isInCart ? 'В корзине' : 'Добавить'}
      </Button>
    </Card>
  )
}, 'ProductCard')
```

`ctx.spy()` inside `reatomComponent` creates a fine-grained subscription — the component re-renders only when the atoms it spies on change. No need for `useCallback`, `useMemo`, or selector functions.

---

## Iterations

### Iteration 1 — Setup + Read-only catalog

- Create `catalog-reatom` experiment, install dependencies
- Copy non-state files from `catalog-zustand`
- `main.tsx`: `createCtx()` + `<ReatomContext.Provider value={ctx}>`
- `features/products/atoms.ts`: `fetchProducts`, `fetchCategories`, `fetchProduct`, filter atoms
- `reatomComponent`: `ProductCard`, `ProductGrid`, `ProductFilters`, `ProductsPage`, `ProductDetailPage` (Add to Cart stubbed)
- Layout with header (cart badge stubbed)

**Deliverable:** browsable, filterable, searchable product catalog. No mutations, no cart.

### Iteration 2 — CRUD

- `deleteProduct`, `createProduct`, `updateProduct` actions with optimistic delete
- `isProductFormOpenAtom`, `editingProductIdAtom` UI flag atoms
- `ProductForm` — react-hook-form + zod, submit calls action
- `reatomComponent` for `ProductDetailPage` with edit/delete actions

**Deliverable:** full CRUD on products with optimistic UI.

### Iteration 3 — Cart

- `cartItemsAtom` + `withLocalStorage('catalog-cart')`
- Computed `totalItemsAtom`, `totalPriceAtom`
- `isCartOpenAtom` for drawer
- `reatomComponent`: `CartDrawer`, `CartItem`, `CartPage`
- "Add to Cart" wired in `ProductCard` and `ProductDetailPage`
- Item count badge in header

**Deliverable:** persistent shopping cart, completing the full Reatom picture.

---

## Testing approach

- Unit tests co-located with components (`*.test.tsx`)
- MSW handlers in `src/mocks/handlers.ts` mock DummyJSON responses (copied from catalog-zustand)
- Each iteration adds tests for its new features
- No E2E (Vitest + MSW covers meaningful cases)
