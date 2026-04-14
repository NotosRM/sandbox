# catalog-zustand

|                 |                                                                                                                                                                                                                                                                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Template**    | react-full                                                                                                                                                                                                                                                                                                                                   |
| **Date**        | 2026-04-12                                                                                                                                                                                                                                                                                                                                   |
| **Status**      | Complete                                                                                                                                                                                                                                                                                                                                     |
| **Goal**        | Reference implementation for state manager comparison: Zustand + TanStack Query                                                                                                                                                                                                                                                              |
| **Conclusions** | TanStack Query handles server state with minimal boilerplate (pagination, cache, optimistic updates). Zustand is ergonomic for client state — persist middleware adds localStorage in ~3 lines. Clear separation between server/client state is a strength of this combo. Main tradeoff: two mental models (query keys vs. store selectors). |

## Stack additions

- `@tanstack/react-query` v5 — server state (product list, detail, mutations, optimistic updates)
- `react-router-dom` v7 — routing
- `zustand` v5 — client state (cart with persist, UI flags for form)
- `react-hook-form` v7 + `zod` v3 — form validation
- shadcn: Input, Dialog, Label, Textarea, Sheet

## Iterations

- **Iteration 1** ✅ — Read-only catalog: list, filters, debounced search, pagination, detail page
- **Iteration 2** ✅ — CRUD: create/edit via form dialog, optimistic delete, UI store
- **Iteration 3** ✅ — Cart: Zustand store, localStorage persist, drawer + full page

## Running

```bash
pnpm dev        # http://localhost:5173
pnpm test:run   # all tests once
pnpm test       # watch mode
```

## Copying to compare with Reatom / Effector

```bash
# From monorepo root
cp -r experiments/catalog-zustand experiments/catalog-reatom
# or
cp -r experiments/catalog-zustand experiments/catalog-effector
# Then replace src/features/cart/store.ts, src/features/ui/store.ts, and src/features/products/api.ts
```
