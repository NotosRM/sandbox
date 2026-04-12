# catalog-zustand Iteration 2: CRUD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add create, edit, and delete operations to the product catalog with optimistic delete and a shared create/edit form.

**Architecture:** Mutation hooks (`useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`) are already implemented in `api.ts` from Iteration 1. This iteration wires them to the UI: a Zustand UI store manages form open/close state, a `ProductForm` dialog handles both create and edit, and delete triggers an optimistic update on the products list.

**Tech Stack:** `zustand` v5 (UI-only, no persist), `react-hook-form` v7, `@hookform/resolvers` v3, `zod` v3, shadcn Dialog + Label

**Prerequisite:** Iteration 1 complete. All tests passing.

---

## File Map

| File                                                    | Action | Purpose                                                        |
| ------------------------------------------------------- | ------ | -------------------------------------------------------------- |
| `package.json`                                          | Modify | Add `zustand`, `react-hook-form`, `@hookform/resolvers`, `zod` |
| `src/features/ui/store.ts`                              | Create | Zustand UI store — form open/close flags                       |
| `src/features/ui/store.test.ts`                         | Create | Store action tests                                             |
| `src/features/products/components/ProductForm.tsx`      | Create | Shared create/edit form in a Dialog                            |
| `src/features/products/components/ProductForm.test.tsx` | Create | Form validation + submit tests                                 |
| `src/features/products/ProductsPage.tsx`                | Modify | Add "New Product" button + ProductForm                         |
| `src/features/products/ProductsPage.test.tsx`           | Modify | Add test for create button presence                            |
| `src/features/products/ProductDetailPage.tsx`           | Modify | Add Edit + Delete buttons                                      |
| `src/features/products/ProductDetailPage.test.tsx`      | Modify | Add edit/delete button tests                                   |
| `README.md`                                             | Update | Mark Iteration 2 complete                                      |

---

### Task 1: Add dependencies + shadcn components

**Files:**

- Modify: `experiments/catalog-zustand/package.json`

- [ ] **Step 1: Add dependencies to package.json**

Edit `experiments/catalog-zustand/package.json`. Add to `"dependencies"`:

```json
"zustand": "^5.0.4",
"react-hook-form": "^7.56.0",
"@hookform/resolvers": "^4.1.3",
"zod": "^3.24.3"
```

- [ ] **Step 2: Add shadcn Dialog and Label**

```bash
cd experiments/catalog-zustand
npx shadcn@latest add dialog
npx shadcn@latest add label
npx shadcn@latest add textarea
```

Expected: `src/components/ui/dialog.tsx`, `src/components/ui/label.tsx`, `src/components/ui/textarea.tsx` created.

- [ ] **Step 3: Install from monorepo root**

```bash
cd d:/Projects/sandbox-notosrm
pnpm install
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/package.json \
        experiments/catalog-zustand/src/components/ui/
git commit -m "feat(catalog-zustand): add form deps and shadcn dialog, label, textarea"
```

---

### Task 2: UI store

**Files:**

- Create: `experiments/catalog-zustand/src/features/ui/store.ts`
- Create: `experiments/catalog-zustand/src/features/ui/store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/ui/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './store';

// Reset store between tests
beforeEach(() => {
  useUIStore.setState({
    isProductFormOpen: false,
    editingProductId: null,
  });
});

describe('useUIStore', () => {
  it('initial state: form closed, no editing id', () => {
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(false);
    expect(state.editingProductId).toBeNull();
  });

  it('openCreateForm: opens form with null editing id', () => {
    useUIStore.getState().openCreateForm();
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(true);
    expect(state.editingProductId).toBeNull();
  });

  it('openEditForm: opens form with the given product id', () => {
    useUIStore.getState().openEditForm(42);
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(true);
    expect(state.editingProductId).toBe(42);
  });

  it('closeForm: closes form and clears editing id', () => {
    useUIStore.getState().openEditForm(42);
    useUIStore.getState().closeForm();
    const state = useUIStore.getState();
    expect(state.isProductFormOpen).toBe(false);
    expect(state.editingProductId).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/ui/store.test.ts
```

Expected: FAIL — `useUIStore` not found.

- [ ] **Step 3: Create UI store**

Create `experiments/catalog-zustand/src/features/ui/store.ts`:

```typescript
import { create } from 'zustand';

interface UIStore {
  isProductFormOpen: boolean;
  editingProductId: number | null;
  openCreateForm: () => void;
  openEditForm: (id: number) => void;
  closeForm: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isProductFormOpen: false,
  editingProductId: null,
  openCreateForm: () => set({ isProductFormOpen: true, editingProductId: null }),
  openEditForm: (id) => set({ isProductFormOpen: true, editingProductId: id }),
  closeForm: () => set({ isProductFormOpen: false, editingProductId: null }),
}));
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/ui/store.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/ui/store.ts \
        experiments/catalog-zustand/src/features/ui/store.test.ts
git commit -m "feat(catalog-zustand): add Zustand UI store for form state"
```

---

### Task 3: ProductForm component

**Files:**

- Create: `experiments/catalog-zustand/src/features/products/components/ProductForm.tsx`
- Create: `experiments/catalog-zustand/src/features/products/components/ProductForm.test.tsx`

The form handles both create (no initial values) and edit (prefilled from an existing product). It reads `editingProductId` from the UI store to decide which mutation to call. The dialog open state is driven by `isProductFormOpen` from the UI store.

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/products/components/ProductForm.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeAll, afterEach, afterAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createServer } from '@sandbox/shared/msw/node';
import { createHandlers } from '@/mocks/handlers';
import { createTestWrapper } from '@/test-utils';
import { useUIStore } from '@/features/ui/store';
import { ProductForm } from './ProductForm';

const server = createServer(...createHandlers('success'));
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

beforeEach(() => {
  useUIStore.setState({ isProductFormOpen: false, editingProductId: null });
});

describe('ProductForm', () => {
  it('does not render dialog content when form is closed', () => {
    render(<ProductForm />, { wrapper: createTestWrapper() });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders create form when isProductFormOpen is true and editingProductId is null', () => {
    useUIStore.setState({ isProductFormOpen: true, editingProductId: null });
    render(<ProductForm />, { wrapper: createTestWrapper() });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('New Product')).toBeInTheDocument();
  });

  it('shows validation error when title is empty on submit', async () => {
    useUIStore.setState({ isProductFormOpen: true, editingProductId: null });
    render(<ProductForm />, { wrapper: createTestWrapper() });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(screen.getByText('Title is required')).toBeInTheDocument());
  });

  it('calls create mutation and closes form on valid submit', async () => {
    const user = userEvent.setup();
    useUIStore.setState({ isProductFormOpen: true, editingProductId: null });
    render(<ProductForm />, { wrapper: createTestWrapper() });

    await user.type(screen.getByLabelText('Title'), 'New Gadget');
    await user.type(screen.getByLabelText('Description'), 'A cool gadget');
    await user.type(screen.getByLabelText('Price'), '49.99');
    await user.type(screen.getByLabelText('Category'), 'electronics');
    await user.type(screen.getByLabelText('Brand'), 'Acme');

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(useUIStore.getState().isProductFormOpen).toBe(false));
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductForm.test.tsx
```

Expected: FAIL — `ProductForm` not found.

- [ ] **Step 3: Create ProductForm**

Create `experiments/catalog-zustand/src/features/products/components/ProductForm.tsx`:

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUIStore } from '@/features/ui/store';
import { useCreateProduct, useUpdateProduct, useProduct } from '../api';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().min(1, 'Brand is required'),
  thumbnail: z.string().url('Must be a valid URL').or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const { isProductFormOpen, editingProductId, closeForm } = useUIStore();
  const isEditMode = editingProductId !== null;

  const { data: existingProduct } = useProduct(editingProductId ?? 0);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: '',
      brand: '',
      thumbnail: '',
    },
  });

  // Prefill form when editing
  useEffect(() => {
    if (isEditMode && existingProduct) {
      reset({
        title: existingProduct.title,
        description: existingProduct.description,
        price: existingProduct.price,
        category: existingProduct.category,
        brand: existingProduct.brand,
        thumbnail: existingProduct.thumbnail,
      });
    } else {
      reset({
        title: '',
        description: '',
        price: 0,
        category: '',
        brand: '',
        thumbnail: '',
      });
    }
  }, [isEditMode, existingProduct, reset]);

  async function onSubmit(data: FormData) {
    if (isEditMode && editingProductId !== null) {
      await updateMutation.mutateAsync({ id: editingProductId, data });
    } else {
      await createMutation.mutateAsync(data as Parameters<typeof createMutation.mutateAsync>[0]);
    }
    closeForm();
  }

  return (
    <Dialog open={isProductFormOpen} onOpenChange={(open) => !open && closeForm()}>
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
            <Button type="button" variant="outline" onClick={closeForm}>
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
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductForm.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/components/ProductForm.tsx \
        experiments/catalog-zustand/src/features/products/components/ProductForm.test.tsx
git commit -m "feat(catalog-zustand): add ProductForm with react-hook-form + zod"
```

---

### Task 4: Wire Create on ProductsPage

**Files:**

- Modify: `experiments/catalog-zustand/src/features/products/ProductsPage.tsx`
- Modify: `experiments/catalog-zustand/src/features/products/ProductsPage.test.tsx`

- [ ] **Step 1: Add test for Create button**

Open `experiments/catalog-zustand/src/features/products/ProductsPage.test.tsx` and add one test to the existing `describe` block:

```tsx
it('renders New Product button', async () => {
  render(<ProductsPage />, { wrapper: createTestWrapper() });
  expect(screen.getByRole('button', { name: 'New Product' })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: Last test FAILS — button not found.

- [ ] **Step 3: Update ProductsPage**

Open `experiments/catalog-zustand/src/features/products/ProductsPage.tsx`.

Add imports at the top:

```tsx
import { useUIStore } from '@/features/ui/store';
import { ProductForm } from './components/ProductForm';
```

Inside `ProductsPage`, add store call after the existing state declarations:

```tsx
const { openCreateForm } = useUIStore();
```

In the JSX, add a "New Product" button next to the heading and mount `<ProductForm />` at the bottom:

```tsx
// Replace the existing <h1> line with:
<div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-bold">Products</h1>
  <Button onClick={openCreateForm}>New Product</Button>
</div>
```

And just before the closing `</div>` of the component, add:

```tsx
<ProductForm />
```

- [ ] **Step 4: Run to verify all ProductsPage tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductsPage.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/ProductsPage.tsx \
        experiments/catalog-zustand/src/features/products/ProductsPage.test.tsx
git commit -m "feat(catalog-zustand): wire New Product button on ProductsPage"
```

---

### Task 5: Wire Edit + Delete on ProductDetailPage

**Files:**

- Modify: `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`
- Modify: `experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx`

Delete navigates to `/products` after success. Edit opens the form via UI store. The optimistic delete is already in `useDeleteProduct` from Iteration 1.

- [ ] **Step 1: Add tests for Edit and Delete buttons**

Open `experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx`.

Add these tests to the existing `describe('ProductDetailPage')` block. Keep all existing imports and the `Wrapper` function as-is:

```tsx
it('renders Edit button', async () => {
  render(<ProductDetailPage />, { wrapper: Wrapper });
  await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
  expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
});

it('renders Delete button', async () => {
  render(<ProductDetailPage />, { wrapper: Wrapper });
  await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
  expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
});

it('clicking Delete calls mutation and navigates to /products', async () => {
  const user = userEvent.setup();
  render(<ProductDetailPage />, { wrapper: Wrapper });
  await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
  await user.click(screen.getByRole('button', { name: 'Delete' }));
  // After optimistic delete + navigation, the products placeholder should show
  // (MemoryRouter has no /products route in this test, so we check mutation was at least triggered)
  // Verify by checking button disappears (navigated away)
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
  );
});
```

Also add the `userEvent` import at the top of the test file:

```tsx
import userEvent from '@testing-library/user-event';
```

And update the `Wrapper` to include a `/products` route so navigation works:

```tsx
function Wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/products/1']}>
        <Routes>
          <Route path="/products/:id" element={children} />
          <Route path="/products" element={<p>Products list</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Run to verify new tests fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: The 3 new tests FAIL, existing 4 still PASS.

- [ ] **Step 3: Update ProductDetailPage**

Open `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`.

Add imports:

```tsx
import { useNavigate } from 'react-router-dom';
import { useDeleteProduct } from './api';
import { useUIStore } from '@/features/ui/store';
import { ProductForm } from './components/ProductForm';
```

Inside `ProductDetailPage`, add after the existing hook calls:

```tsx
const navigate = useNavigate();
const { openEditForm } = useUIStore();
const deleteMutation = useDeleteProduct();

async function handleDelete() {
  await deleteMutation.mutateAsync(product.id);
  navigate('/products');
}
```

Replace the existing `<Button className="w-full mt-6">Add to Cart</Button>` with:

```tsx
<div className="flex gap-2 mt-6">
  <Button variant="outline" className="flex-1" onClick={() => openEditForm(product.id)}>
    Edit
  </Button>
  <Button
    variant="destructive"
    className="flex-1"
    onClick={handleDelete}
    disabled={deleteMutation.isPending}
  >
    Delete
  </Button>
  <Button className="flex-1">Add to Cart</Button>
</div>
```

Add `<ProductForm />` just before the closing `</div>` of the component:

```tsx
<ProductForm />
```

- [ ] **Step 4: Run to verify all tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
cd experiments/catalog-zustand
pnpm test:run
```

Expected: All tests PASS, no regressions.

- [ ] **Step 6: Type-check**

```bash
cd experiments/catalog-zustand
pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 7: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx \
        experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx
git commit -m "feat(catalog-zustand): wire Edit and Delete on ProductDetailPage"
```

---

### Task 6: Final verification + README

- [ ] **Step 1: Start dev server and verify manually**

```bash
cd experiments/catalog-zustand
pnpm dev
```

Open http://localhost:5173 and verify:

- "New Product" button opens the create form dialog
- Filling the form and saving creates a product (response from DummyJSON) and closes the dialog
- Validation errors appear for empty required fields
- On product detail page, Edit button opens form prefilled with product data
- Delete button removes the product optimistically from the list and navigates back
- Cart placeholder page is still accessible via header icon

Stop with Ctrl+C.

- [ ] **Step 2: Update README**

In `experiments/catalog-zustand/README.md`, update the Iterations section:

```markdown
## Iterations

- **Iteration 1** ✅ — Read-only catalog: list, filters, debounced search, pagination, detail page
- **Iteration 2** ✅ — CRUD: create/edit via form dialog, optimistic delete, UI store (Zustand)
- **Iteration 3** — Cart: Zustand store + localStorage persist
```

Also update status:

```markdown
| **Status** | In Progress — Iteration 2 complete |
```

- [ ] **Step 3: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/README.md
git commit -m "docs(catalog-zustand): update README after iteration 2"
```
