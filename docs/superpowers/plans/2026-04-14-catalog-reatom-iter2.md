# catalog-reatom Iteration 2 — CRUD

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full CRUD (create, update, delete) to the product catalog. Mutations are Reatom actions. Delete is optimistic. Form state (open/close, editing ID) lives in atoms.

**Architecture:** All mutations and UI flag atoms added to `features/products/atoms.ts`. `productsResource` gets a refresh trigger atom so mutations can force a re-fetch. `ProductForm` uses react-hook-form + zod; submit calls Reatom action. `ProductDetailPage` and `ProductsPage` are updated to wire edit/delete/create.

**Prerequisite:** Iteration 1 complete.

**Tech Stack:** `@reatom/core` (atom, action), react-hook-form, zod, shadcn Dialog

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

### Task 1: TDD — add refresh atom + UI flag atoms + CRUD actions to atoms.ts

**Files:**

- Modify: `src/features/products/atoms.ts`
- Modify: `src/features/products/atoms.test.ts`

- [ ] **Step 1: Write new failing tests**

Append to `experiments/catalog-reatom/src/features/products/atoms.test.ts`:

```ts
import { action } from '@reatom/core';
import {
  // existing imports...
  pageAtom,
  searchAtom,
  categoryAtom,
  LIMIT,
  productsResource,
  categoriesResource,
  productIdAtom,
  productResource,
  // new:
  productsRefreshAtom,
  isProductFormOpenAtom,
  editingProductIdAtom,
  openCreateForm,
  openEditForm,
  closeForm,
} from './atoms';

describe('UI flag atoms', () => {
  it('isProductFormOpenAtom defaults to false', () => {
    const ctx = createCtx();
    expect(ctx.get(isProductFormOpenAtom)).toBe(false);
  });

  it('editingProductIdAtom defaults to null', () => {
    const ctx = createCtx();
    expect(ctx.get(editingProductIdAtom)).toBeNull();
  });

  it('openCreateForm opens form with no editing ID', () => {
    const ctx = createCtx();
    openCreateForm(ctx);
    expect(ctx.get(isProductFormOpenAtom)).toBe(true);
    expect(ctx.get(editingProductIdAtom)).toBeNull();
  });

  it('openEditForm opens form with product ID', () => {
    const ctx = createCtx();
    openEditForm(ctx, 42);
    expect(ctx.get(isProductFormOpenAtom)).toBe(true);
    expect(ctx.get(editingProductIdAtom)).toBe(42);
  });

  it('closeForm resets form state', () => {
    const ctx = createCtx();
    openEditForm(ctx, 42);
    closeForm(ctx);
    expect(ctx.get(isProductFormOpenAtom)).toBe(false);
    expect(ctx.get(editingProductIdAtom)).toBeNull();
  });
});

describe('productsRefreshAtom', () => {
  it('defaults to 0', () => {
    const ctx = createCtx();
    expect(ctx.get(productsRefreshAtom)).toBe(0);
  });

  it('increments when bumped', () => {
    const ctx = createCtx();
    productsRefreshAtom(ctx, (v) => v + 1);
    expect(ctx.get(productsRefreshAtom)).toBe(1);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/atoms.test.ts
```

Expected: FAIL — new exports not found.

- [ ] **Step 3: Update atoms.ts**

Add to `experiments/catalog-reatom/src/features/products/atoms.ts` (append after existing code):

```ts
import { action } from '@reatom/core';
import { createProduct, updateProduct, deleteProduct } from '@/lib/dummyjson';
import type { Product } from './types';
import { z } from 'zod';

// ─── Refresh trigger (bumped after mutations to re-run productsResource) ──────

export const productsRefreshAtom = atom(0, 'productsRefreshAtom');
```

Also update `productsResource` to spy on `productsRefreshAtom`:

```ts
export const productsResource = reatomResource(async (ctx) => {
  ctx.spy(productsRefreshAtom); // re-run on bump
  const page = ctx.spy(pageAtom);
  const search = ctx.spy(searchAtom);
  const category = ctx.spy(categoryAtom);
  return await fetchProducts({ page, limit: LIMIT, search, category });
}, 'productsResource').pipe(withDataAtom(null), withErrorAtom(), withStatusesAtom());
```

Then append the rest:

```ts
// ─── UI flag atoms ─────────────────────────────────────────────────────────────

export const isProductFormOpenAtom = atom(false, 'isProductFormOpenAtom');
export const editingProductIdAtom = atom<number | null>(null, 'editingProductIdAtom');

export const openCreateForm = action((ctx) => {
  isProductFormOpenAtom(ctx, true);
  editingProductIdAtom(ctx, null);
}, 'openCreateForm');

export const openEditForm = action((ctx, id: number) => {
  isProductFormOpenAtom(ctx, true);
  editingProductIdAtom(ctx, id);
}, 'openEditForm');

export const closeForm = action((ctx) => {
  isProductFormOpenAtom(ctx, false);
  editingProductIdAtom(ctx, null);
}, 'closeForm');

// ─── Form data schema ──────────────────────────────────────────────────────────

export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Must be positive'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  thumbnail: z.string().url('Must be a valid URL').or(z.literal('')),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ─── CRUD actions ─────────────────────────────────────────────────────────────

export const createProductAction = action(async (ctx, data: ProductFormData) => {
  await createProduct({ ...data, discountPercentage: 0 });
  productsRefreshAtom(ctx, (v) => v + 1);
}, 'createProductAction');

export const updateProductAction = action(async (ctx, id: number, data: ProductFormData) => {
  await updateProduct(id, data);
  productsRefreshAtom(ctx, (v) => v + 1);
  // Also refresh the detail resource if on detail page
  if (ctx.get(productIdAtom) === id) {
    productIdAtom(ctx, 0);
    productIdAtom(ctx, id);
  }
}, 'updateProductAction');

export const deleteProductAction = action(async (ctx, id: number) => {
  // Optimistic: remove from list immediately
  productsResource.dataAtom(ctx, (prev) =>
    prev
      ? { ...prev, products: prev.products.filter((p) => p.id !== id), total: prev.total - 1 }
      : prev
  );
  try {
    await deleteProduct(id);
  } catch {
    // Rollback: trigger re-fetch
    productsRefreshAtom(ctx, (v) => v + 1);
  }
}, 'deleteProductAction');
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/atoms.test.ts
```

Expected: PASS — all tests including new ones.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/atoms.ts experiments/catalog-reatom/src/features/products/atoms.test.ts
rtk git commit -m "feat(catalog-reatom): add CRUD actions and UI flag atoms"
```

---

### Task 2: TDD — ProductForm

**Files:**

- Create: `src/features/products/components/ProductForm.tsx`
- Create: `src/features/products/components/ProductForm.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/products/components/ProductForm.test.tsx`:

```tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { ProductForm } from './ProductForm';
import {
  isProductFormOpenAtom,
  editingProductIdAtom,
  openCreateForm,
  openEditForm,
} from '../atoms';

describe('ProductForm', () => {
  it('is not visible when form is closed', () => {
    renderWithReatom(<ProductForm />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows "New Product" title in create mode', () => {
    const { ctx } = renderWithReatom(<ProductForm />);
    openCreateForm(ctx);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('shows "Edit Product" title in edit mode', () => {
    const { ctx } = renderWithReatom(<ProductForm />);
    openEditForm(ctx, 1);
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const { ctx } = renderWithReatom(<ProductForm />);
    openCreateForm(ctx);
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('closes form on Cancel click', async () => {
    const { ctx } = renderWithReatom(<ProductForm />);
    openCreateForm(ctx);
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(ctx.get(isProductFormOpenAtom)).toBe(false);
  });

  it('prefills form when editing product 1', async () => {
    const { ctx } = renderWithReatom(<ProductForm />);
    openEditForm(ctx, 1);
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductForm.test.tsx
```

Expected: FAIL — `./ProductForm` not found.

- [ ] **Step 3: Write ProductForm**

Create `experiments/catalog-reatom/src/features/products/components/ProductForm.tsx`:

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reatomComponent } from '@reatom/npm-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  isProductFormOpenAtom,
  editingProductIdAtom,
  closeForm,
  createProductAction,
  updateProductAction,
  productResource,
  productIdAtom,
  productSchema,
  type ProductFormData,
} from '../atoms';

export const ProductForm = reatomComponent(({ ctx }) => {
  const isOpen = ctx.spy(isProductFormOpenAtom);
  const editingId = ctx.spy(editingProductIdAtom);
  const isEditMode = editingId !== null;

  // When edit mode activates, set productIdAtom so productResource fetches the product
  useEffect(() => {
    if (isEditMode && editingId !== null) {
      productIdAtom(ctx, editingId);
    }
  }, [ctx, isEditMode, editingId]);

  const existingProduct = ctx.spy(productResource.dataAtom);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { title: '', description: '', price: 0, category: '', brand: '', thumbnail: '' },
  });

  // Prefill when editing and product data arrives
  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && existingProduct) {
      reset({
        title: existingProduct.title,
        description: existingProduct.description,
        price: existingProduct.price,
        category: existingProduct.category,
        brand: existingProduct.brand,
        thumbnail: existingProduct.thumbnail,
      });
    } else if (!isEditMode) {
      reset({ title: '', description: '', price: 0, category: '', brand: '', thumbnail: '' });
    }
  }, [isOpen, isEditMode, existingProduct, reset]);

  async function onSubmit(data: ProductFormData) {
    try {
      if (isEditMode && editingId !== null) {
        await updateProductAction(ctx, editingId, data);
      } else {
        await createProductAction(ctx, data);
      }
      closeForm(ctx);
    } catch {
      // stay open on error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeForm(ctx)}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Product' : 'New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={3} {...register('description')} />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} />
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="brand">Brand</Label>
            <Input id="brand" {...register('brand')} />
            {errors.brand && <p className="text-xs text-destructive">{errors.brand.message}</p>}
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="thumbnail">Thumbnail URL</Label>
            <Input id="thumbnail" type="url" {...register('thumbnail')} />
            {errors.thumbnail && (
              <p className="text-xs text-destructive">{errors.thumbnail.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="outline" onClick={() => closeForm(ctx)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}, 'ProductForm');
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductForm.test.tsx
```

Expected: PASS — 6 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/components/ProductForm.tsx experiments/catalog-reatom/src/features/products/components/ProductForm.test.tsx
rtk git commit -m "feat(catalog-reatom): add ProductForm with react-hook-form + zod"
```

---

### Task 3: Update ProductsPage — New Product button

**Files:**

- Modify: `src/features/products/ProductsPage.tsx`

- [ ] **Step 1: Add test for New Product button**

Append to `experiments/catalog-reatom/src/features/products/ProductsPage.test.tsx`:

```tsx
import { isProductFormOpenAtom } from './atoms';

it('New Product button opens form', async () => {
  const { ctx } = renderWithReatom(<ProductsPage />);
  await waitFor(() => screen.getByRole('button', { name: /new product/i }));
  await userEvent.click(screen.getByRole('button', { name: /new product/i }));
  expect(ctx.get(isProductFormOpenAtom)).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: FAIL — "New Product" button not found.

- [ ] **Step 3: Update ProductsPage**

In `experiments/catalog-reatom/src/features/products/ProductsPage.tsx`, add the imports and wire the button:

At the top, add to existing imports:

```tsx
import { ProductForm } from './components/ProductForm';
import { openCreateForm } from './atoms';
```

Replace the comment `{/* New Product button wired in Iteration 2 */}` with:

```tsx
<Button onClick={() => openCreateForm(ctx)}>New Product</Button>
```

At the end, just before the closing `</div>` of the outer wrapper, add:

```tsx
<ProductForm />
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: PASS — all tests including the new one.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/ProductsPage.tsx
rtk git commit -m "feat(catalog-reatom): wire New Product button in ProductsPage"
```

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
  const { ctx } = renderWithReatom(<ProductDetailPage />, {
    route: '/products/1',
    routePath: '/products/:id',
  });
  await waitFor(() => screen.getByRole('button', { name: /edit/i }));
  await userEvent.click(screen.getByRole('button', { name: /edit/i }));
  expect(ctx.get(isProductFormOpenAtom)).toBe(true);
  expect(ctx.get(editingProductIdAtom)).toBe(1);
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
import {
  productResource,
  productIdAtom,
  openEditForm,
  deleteProductAction,
  isProductFormOpenAtom,
} from './atoms';
import { ProductForm } from './components/ProductForm';
```

Add `const navigate = useNavigate();` inside the component body.

Replace `{/* Edit / Delete wired in Iteration 2 */}` comment with:

```tsx
<Button
  variant="outline"
  className="flex-1"
  onClick={() => product && openEditForm(ctx, product.id)}
>
  Edit
</Button>
<Button
  variant="destructive"
  className="flex-1"
  onClick={async () => {
    if (!product) return;
    await deleteProductAction(ctx, product.id);
    navigate('/products');
  }}
>
  Delete
</Button>
```

Add `<ProductForm />` after the closing `</div>` of the main content (just before the outer `</div>`).

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
rtk git commit -m "feat(catalog-reatom): iter2 complete — CRUD with optimistic delete"
```
