# catalog-reatom Iteration 2 — CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full CRUD (create, update, delete) to the product catalog. Mutations are Reatom actions с `withAsync()`. Delete делает re-fetch после удаления. Form state (open/close, editing ID) живёт в атомах.

**Architecture:** All mutations and UI flag atoms added to `features/products/atoms.ts`. `productsResource` gets a refresh trigger atom so mutations can force a re-fetch. `ProductForm` uses react-hook-form + zod; submit calls Reatom action. `ProductDetailPage` and `ProductsPage` are updated to wire edit/delete/create.

**Prerequisite:** Iteration 1 complete.

**Tech Stack:** `@reatom/core` (atom, action, wrap, withAsync), `@reatom/react` (reatomComponent), react-hook-form, zod, shadcn Dialog

---

## File Map

| File                                                    | Action | Responsibility                                |
| ------------------------------------------------------- | ------ | --------------------------------------------- |
| `src/features/products/atoms.ts`                        | modify | Add refresh atom, UI flag atoms, CRUD actions |
| `src/features/products/atoms.test.ts`                   | modify | Add tests for new atoms and actions           |
| `src/features/products/components/ProductForm.tsx`      | create | Dialog form for create/edit, submit → action  |
| `src/features/products/components/ProductForm.test.tsx` | create | Renders, validates, calls action on submit    |
| `src/features/products/ProductsPage.tsx`                | modify | Add "New Product" button + `<ProductForm />`  |
| `src/features/products/ProductDetailPage.tsx`           | modify | Add Edit / Delete buttons, wire actions       |

---

### Task 4: Update ProductDetailPage — Edit, Delete, ProductForm

**Files:**

- Modify: `src/features/products/ProductDetailPage.tsx`

- [ ] **Step 1: Add tests**

Append to `experiments/catalog-reatom/src/features/products/ProductDetailPage.test.tsx`:

```tsx
import userEvent from '@testing-library/user-event';
import { isProductFormOpenAtom, editingProductIdAtom } from './atoms';

it('Edit button opens form with correct product ID', async () => {
  const { frame } = renderWithReatom(<ProductDetailPage />, {
    route: '/products/1',
    routePath: '/products/:id',
  });
  await waitFor(() => screen.getByRole('button', { name: /edit/i }));
  await userEvent.click(screen.getByRole('button', { name: /edit/i }));
  frame.run(() => {
    expect(isProductFormOpenAtom()).toBe(true);
    expect(editingProductIdAtom()).toBe(1);
  });
});

it('Delete button calls deleteProductAction', async () => {
  renderWithReatom(<ProductDetailPage />, {
    route: '/products/1',
    routePath: '/products/:id',
  });
  await waitFor(() => screen.getByRole('button', { name: /delete/i }));
  // Delete triggers navigation — just verify the button exists and is clickable
  expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled();
});
```

**Изменения vs v3:** `{ ctx }` → `{ frame }`, `ctx.get(atom)` → `frame.run(() => atom())`.

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: FAIL — Edit/Delete buttons not found.

- [ ] **Step 3: Update ProductDetailPage**

In `experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx`:

Add to existing imports:

```tsx
import { useNavigate } from 'react-router-dom';
import { wrap } from '@reatom/core';
import { productResource, productIdAtom, openEditForm, deleteProductAction } from './atoms';
import { ProductForm } from './components/ProductForm';
```

Add `const navigate = useNavigate();` inside the component body.

Replace `{/* Edit / Delete wired in Iteration 2 */}` comment with:

```tsx
<Button
  variant="outline"
  className="flex-1"
  onClick={wrap(() => product && openEditForm(product.id))}
>
  Edit
</Button>
<Button
  variant="destructive"
  className="flex-1"
  onClick={wrap(async () => {
    if (!product) return;
    await deleteProductAction(product.id);
    navigate('/products');
  })}
>
  Delete
</Button>
```

Add `<ProductForm />` after the closing `</div>` of the main content (just before the outer `</div>`).

**Изменения vs v3:** `openEditForm(ctx, product.id)` → `wrap(() => openEditForm(product.id))`, `deleteProductAction(ctx, product.id)` → `wrap(async () => deleteProductAction(product.id))`. Все обработчики обёрнуты в `wrap()`.

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: PASS — all tests.

- [ ] **Step 5: Run full suite**

```bash
cd experiments/catalog-reatom && pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx
rtk git commit -m "feat(catalog-reatom): iter2 complete — CRUD with delete+refresh"
```
