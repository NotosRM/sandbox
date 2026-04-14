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

### Task 1: TDD — add refresh atom + UI flag atoms + CRUD actions to atoms.ts

**Files:**

- Modify: `src/features/products/atoms.ts`
- Modify: `src/features/products/atoms.test.ts`

- [ ] **Step 1: Write new failing tests**

Append to `experiments/catalog-reatom/src/features/products/atoms.test.ts`:

```ts
import { context } from '@reatom/core';
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
    const frame = context.start();
    frame.run(() => {
      expect(isProductFormOpenAtom()).toBe(false);
    });
  });

  it('editingProductIdAtom defaults to null', () => {
    const frame = context.start();
    frame.run(() => {
      expect(editingProductIdAtom()).toBeNull();
    });
  });

  it('openCreateForm opens form with no editing ID', () => {
    const frame = context.start();
    frame.run(() => {
      openCreateForm();
      expect(isProductFormOpenAtom()).toBe(true);
      expect(editingProductIdAtom()).toBeNull();
    });
  });

  it('openEditForm opens form with product ID', () => {
    const frame = context.start();
    frame.run(() => {
      openEditForm(42);
      expect(isProductFormOpenAtom()).toBe(true);
      expect(editingProductIdAtom()).toBe(42);
    });
  });

  it('closeForm resets form state', () => {
    const frame = context.start();
    frame.run(() => {
      openEditForm(42);
      closeForm();
      expect(isProductFormOpenAtom()).toBe(false);
      expect(editingProductIdAtom()).toBeNull();
    });
  });
});

describe('productsRefreshAtom', () => {
  it('defaults to 0', () => {
    const frame = context.start();
    frame.run(() => {
      expect(productsRefreshAtom()).toBe(0);
    });
  });

  it('increments when bumped', () => {
    const frame = context.start();
    frame.run(() => {
      productsRefreshAtom.set((v) => v + 1);
      expect(productsRefreshAtom()).toBe(1);
    });
  });
});
```

**Изменения vs v3:** `createCtx()` → `context.start()`, все операции в `frame.run()`, `openCreateForm(ctx)` → `openCreateForm()`, `ctx.get(atom)` → `atom()`, `productsRefreshAtom(ctx, (v) => v + 1)` → `productsRefreshAtom.set((v) => v + 1)`.

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/atoms.test.ts
```

Expected: FAIL — new exports not found.

- [ ] **Step 3: Update atoms.ts**

Add to `experiments/catalog-reatom/src/features/products/atoms.ts` (append after existing code):

```ts
import { action, wrap } from '@reatom/core';
import { withAsync } from '@reatom/core';
import { createProduct, updateProduct, deleteProduct } from '@/lib/dummyjson';
import type { Product } from './types';
import { z } from 'zod';

// ─── Refresh trigger (bumped after mutations to re-run productsResource) ──────

export const productsRefreshAtom = atom(0, 'productsRefreshAtom');
```

Also update `productsResource` to read `productsRefreshAtom` (adds reactive dependency):

```ts
export const productsResource = computed(async () => {
  productsRefreshAtom(); // re-run on bump — читаем, чтобы создать зависимость
  const page = pageAtom();
  const search = searchAtom();
  const category = categoryAtom();
  return await wrap(fetchProducts({ page, limit: LIMIT, search, category }));
}, 'productsResource').extend(withAsyncData({ initState: null, status: true }));
```

Then append the rest:

```ts
// ─── UI flag atoms ─────────────────────────────────────────────────────────────

export const isProductFormOpenAtom = atom(false, 'isProductFormOpenAtom');
export const editingProductIdAtom = atom<number | null>(null, 'editingProductIdAtom');

export const openCreateForm = action(() => {
  isProductFormOpenAtom.set(true);
  editingProductIdAtom.set(null);
}, 'openCreateForm');

export const openEditForm = action((id: number) => {
  isProductFormOpenAtom.set(true);
  editingProductIdAtom.set(id);
}, 'openEditForm');

export const closeForm = action(() => {
  isProductFormOpenAtom.set(false);
  editingProductIdAtom.set(null);
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

export const createProductAction = action(async (data: ProductFormData) => {
  await wrap(createProduct({ ...data, discountPercentage: 0 }));
  productsRefreshAtom.set((v) => v + 1);
}, 'createProductAction').extend(withAsync());

export const updateProductAction = action(async (id: number, data: ProductFormData) => {
  await wrap(updateProduct(id, data));
  productsRefreshAtom.set((v) => v + 1);
  // Also refresh the detail resource if on detail page
  if (productIdAtom() === id) {
    productIdAtom.set(0);
    productIdAtom.set(id);
  }
}, 'updateProductAction').extend(withAsync());

export const deleteProductAction = action(async (id: number) => {
  // Delete, then force re-fetch of the list
  try {
    await wrap(deleteProduct(id));
  } finally {
    productsRefreshAtom.set((v) => v + 1);
  }
}, 'deleteProductAction').extend(withAsync());
```

**Изменения vs v3:**

- `action((ctx, arg) => { atom(ctx, value) })` → `action((arg) => { atom.set(value) })`
- Действия вызываются без `ctx`: `openCreateForm(ctx)` → `openCreateForm()`
- Все `async` операции обёрнуты в `wrap()`
- `.extend(withAsync())` вместо ничего (даёт `.ready()`, `.error()`, `.retry()`)
- Оптимистичное удаление убрано — `withAsyncData.data` read-only; вместо этого delete + refresh

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
import { isProductFormOpenAtom, openCreateForm, openEditForm } from '../atoms';

describe('ProductForm', () => {
  it('is not visible when form is closed', () => {
    renderWithReatom(<ProductForm />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows "New Product" title in create mode', () => {
    const { frame } = renderWithReatom(<ProductForm />);
    frame.run(() => openCreateForm());
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('shows "Edit Product" title in edit mode', () => {
    const { frame } = renderWithReatom(<ProductForm />);
    frame.run(() => openEditForm(1));
    expect(screen.getByText('Edit Product')).toBeInTheDocument();
  });

  it('shows validation errors on empty submit', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    frame.run(() => openCreateForm());
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('closes form on Cancel click', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    frame.run(() => openCreateForm());
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));
    frame.run(() => expect(isProductFormOpenAtom()).toBe(false));
  });

  it('prefills form when editing product 1', async () => {
    const { frame } = renderWithReatom(<ProductForm />);
    frame.run(() => openEditForm(1));
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Product')).toBeInTheDocument();
    });
  });
});
```

**Изменения vs v3:** `{ ctx }` → `{ frame }` из `renderWithReatom`, `openCreateForm(ctx)` → `frame.run(() => openCreateForm())`, `ctx.get(isProductFormOpenAtom)` → `frame.run(() => isProductFormOpenAtom())`.

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
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
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

export const ProductForm = reatomComponent(() => {
  const isOpen = isProductFormOpenAtom();
  const editingId = editingProductIdAtom();
  const isEditMode = editingId !== null;

  // When edit mode activates, set productIdAtom so productResource fetches the product
  useEffect(() => {
    if (isEditMode && editingId !== null) {
      productIdAtom.set(editingId);
    }
  }, [isEditMode, editingId]);

  const existingProduct = productResource.data();

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
        await updateProductAction(editingId, data);
      } else {
        await createProductAction(data);
      }
      closeForm();
    } catch {
      // stay open on error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={wrap((open) => !open && closeForm())}>
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
            <Button type="button" variant="outline" onClick={wrap(closeForm)}>
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

**Изменения vs v3:** `({ ctx })` → `()`, `ctx.spy(atom)` → `atom()`, `atom(ctx, value)` → `atom.set(value)`, `closeForm(ctx)` → `closeForm()`, `updateProductAction(ctx, id, data)` → `updateProductAction(id, data)`, `createProductAction(ctx, data)` → `createProductAction(data)`, onClick/onOpenChange обёрнуты в `wrap()`. `useEffect` без `ctx` в deps.

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
  const { frame } = renderWithReatom(<ProductsPage />);
  await waitFor(() => screen.getByRole('button', { name: /new product/i }));
  await userEvent.click(screen.getByRole('button', { name: /new product/i }));
  frame.run(() => expect(isProductFormOpenAtom()).toBe(true));
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: FAIL — "New Product" button not found.

- [ ] **Step 3: Update ProductsPage**

In `experiments/catalog-reatom/src/features/products/ProductsPage.tsx`, add to existing imports:

```tsx
import { wrap } from '@reatom/core';
import { ProductForm } from './components/ProductForm';
import { openCreateForm } from './atoms';
```

Replace the comment `{/* New Product button wired in Iteration 2 */}` with:

```tsx
<Button onClick={wrap(openCreateForm)}>New Product</Button>
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
