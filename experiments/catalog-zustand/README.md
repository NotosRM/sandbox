# catalog-zustand

|                 |                                                                                 |
| --------------- | ------------------------------------------------------------------------------- |
| **Template**    | react-full                                                                      |
| **Date**        | 2026-04-12                                                                      |
| **Status**      | In Progress — Iteration 2 complete                                              |
| **Goal**        | Reference implementation for state manager comparison: Zustand + TanStack Query |
| **Conclusions** | —                                                                               |

## Stack additions

- `@tanstack/react-query` v5 — server state (product list, detail, mutations)
- `react-router-dom` v7 — routing
- `zustand` — client state, added in Iteration 3

## Iterations

- **Iteration 1** ✅ — Read-only catalog: list, filters, debounced search, pagination, detail page
- **Iteration 2** ✅ — CRUD: create/edit via form dialog, optimistic delete, UI store (Zustand)
- **Iteration 3** — Cart: Zustand store + localStorage persist

## Running

```bash
pnpm dev        # http://localhost:5173
pnpm test:run   # all tests once
pnpm test       # watch mode
```
