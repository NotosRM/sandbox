# catalog-zustand Iteration 3: Cart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent shopping cart: Zustand store with `localStorage` persist, a drawer for quick access, a full `/cart` page, and "Add to Cart" wired on ProductCard and ProductDetailPage.

**Architecture:** A single Zustand cart store with `persist` middleware persists `items` to `localStorage`. Cart is accessible from two places: a `CartDrawer` overlay toggled from the header, and the full `CartPage` at `/cart`. The header badge shows live item count from the store. "Add to Cart" buttons on ProductCard and ProductDetailPage dispatch `addItem` to the same store.

**Tech Stack:** `zustand` v5 with `persist` middleware (already installed in Iteration 2)

**Prerequisite:** Iterations 1 and 2 complete. All tests passing.

---

## File Map

| File                                                    | Action  | Purpose                                           |
| ------------------------------------------------------- | ------- | ------------------------------------------------- |
| `src/features/cart/store.ts`                            | Create  | Zustand cart store with localStorage persist      |
| `src/features/cart/store.test.ts`                       | Create  | Store action + derivation tests                   |
| `src/features/cart/components/CartItem.tsx`             | Create  | Single cart item row (quantity controls + remove) |
| `src/features/cart/components/CartItem.test.tsx`        | Create  | Render + interaction tests                        |
| `src/features/cart/components/CartDrawer.tsx`           | Create  | Slide-over panel from header                      |
| `src/features/cart/components/CartDrawer.test.tsx`      | Create  | Open/close + items render tests                   |
| `src/features/cart/CartPage.tsx`                        | Replace | Full cart page (replaces placeholder)             |
| `src/features/cart/CartPage.test.tsx`                   | Create  | Empty state + items + total tests                 |
| `src/components/Layout.tsx`                             | Modify  | Cart icon badge + CartDrawer mount                |
| `src/features/products/components/ProductCard.tsx`      | Modify  | "Add to Cart" button wired                        |
| `src/features/products/components/ProductCard.test.tsx` | Modify  | Test Add to Cart button                           |
| `src/features/products/ProductDetailPage.tsx`           | Modify  | "Add to Cart" button wired                        |
| `src/features/products/ProductDetailPage.test.tsx`      | Modify  | Test Add to Cart button                           |
| `README.md`                                             | Update  | Mark Iteration 3 complete + add conclusions       |

---

### Task 1: Cart store

**Files:**

- Create: `experiments/catalog-zustand/src/features/cart/store.ts`
- Create: `experiments/catalog-zustand/src/features/cart/store.test.ts`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/cart/store.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useCartStore } from './store';
import { mockProduct } from '@/mocks/handlers';

// Reset store before each test — clear localStorage and reset state
beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('useCartStore — cart items', () => {
  it('initial state: empty items', () => {
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('addItem: adds product with quantity 1', () => {
    useCartStore.getState().addItem(mockProduct);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe(mockProduct.id);
    expect(items[0].quantity).toBe(1);
  });

  it('addItem: increments quantity when same product added twice', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    const { items } = useCartStore.getState();
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(2);
  });

  it('removeItem: removes a product by id', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().removeItem(mockProduct.id);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('updateQuantity: sets exact quantity', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity(mockProduct.id, 5);
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('updateQuantity: removes item when quantity set to 0', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().updateQuantity(mockProduct.id, 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it('clearCart: empties all items', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});

describe('useCartStore — derived values', () => {
  it('totalItems: sum of all quantities', () => {
    useCartStore.getState().addItem(mockProduct);
    useCartStore.getState().addItem(mockProduct);
    expect(useCartStore.getState().totalItems).toBe(2);
  });

  it('totalPrice: sum of price * quantity', () => {
    useCartStore.getState().addItem(mockProduct); // price 99.99
    useCartStore.getState().addItem(mockProduct); // qty becomes 2
    expect(useCartStore.getState().totalPrice).toBeCloseTo(199.98, 2);
  });
});

describe('useCartStore — drawer state', () => {
  it('initial state: drawer closed', () => {
    expect(useCartStore.getState().isCartOpen).toBe(false);
  });

  it('toggleCart: opens and closes', () => {
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isCartOpen).toBe(true);
    useCartStore.getState().toggleCart();
    expect(useCartStore.getState().isCartOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/store.test.ts
```

Expected: FAIL — `useCartStore` not found.

- [ ] **Step 3: Create cart store**

Create `experiments/catalog-zustand/src/features/cart/store.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '@/features/products/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartStore {
  // Persisted
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  // Derived (computed on access)
  readonly totalItems: number;
  readonly totalPrice: number;
  // Not persisted (UI state)
  isCartOpen: boolean;
  toggleCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isCartOpen: false,

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product.id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.product.id !== productId)
              : state.items.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),

      get totalItems() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      get totalPrice() {
        return get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
      },

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
    }),
    {
      name: 'catalog-cart',
      // Only persist cart items — not UI state
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/store.test.ts
```

Expected: All 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/cart/store.ts \
        experiments/catalog-zustand/src/features/cart/store.test.ts
git commit -m "feat(catalog-zustand): add Zustand cart store with localStorage persist"
```

---

### Task 2: CartItem component

**Files:**

- Create: `experiments/catalog-zustand/src/features/cart/components/CartItem.tsx`
- Create: `experiments/catalog-zustand/src/features/cart/components/CartItem.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/cart/components/CartItem.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useCartStore } from '../store';
import { mockProduct } from '@/mocks/handlers';
import { CartItem } from './CartItem';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('CartItem', () => {
  it('renders product title and price', () => {
    render(<CartItem item={{ product: mockProduct, quantity: 2 }} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('renders current quantity', () => {
    render(<CartItem item={{ product: mockProduct, quantity: 3 }} />);
    expect(screen.getByDisplayValue('3')).toBeInTheDocument();
  });

  it('calls updateQuantity when quantity input changes', () => {
    useCartStore.setState({ items: [{ product: mockProduct, quantity: 2 }] });
    render(<CartItem item={{ product: mockProduct, quantity: 2 }} />);
    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '5' } });
    expect(useCartStore.getState().items[0].quantity).toBe(5);
  });

  it('calls removeItem when Remove button is clicked', () => {
    useCartStore.setState({ items: [{ product: mockProduct, quantity: 1 }] });
    render(<CartItem item={{ product: mockProduct, quantity: 1 }} />);
    fireEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/components/CartItem.test.tsx
```

Expected: FAIL — `CartItem` not found.

- [ ] **Step 3: Create CartItem**

Create `experiments/catalog-zustand/src/features/cart/components/CartItem.tsx`:

```tsx
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '../store';
import type { CartItem as CartItemType } from '../store';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
  const { product, quantity } = item;

  return (
    <div className="flex items-center gap-3 py-3">
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-16 h-16 rounded object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-1">{product.title}</p>
        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
      </div>
      <Input
        type="number"
        min={1}
        value={quantity}
        onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
        className="w-16 text-center"
        aria-label={`Quantity for ${product.title}`}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(product.id)}
        aria-label={`Remove ${product.title}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/components/CartItem.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/cart/components/CartItem.tsx \
        experiments/catalog-zustand/src/features/cart/components/CartItem.test.tsx
git commit -m "feat(catalog-zustand): add CartItem component"
```

---

### Task 3: CartDrawer component

**Files:**

- Create: `experiments/catalog-zustand/src/features/cart/components/CartDrawer.tsx`
- Create: `experiments/catalog-zustand/src/features/cart/components/CartDrawer.test.tsx`

shadcn has a Sheet component that works as a drawer. Add it first.

- [ ] **Step 1: Add shadcn Sheet component**

```bash
cd experiments/catalog-zustand
npx shadcn@latest add sheet
```

Expected: `src/components/ui/sheet.tsx` created.

- [ ] **Step 2: Write failing tests**

Create `experiments/catalog-zustand/src/features/cart/components/CartDrawer.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useCartStore } from '../store';
import { mockProduct } from '@/mocks/handlers';
import { CartDrawer } from './CartDrawer';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('CartDrawer', () => {
  it('does not show content when closed', () => {
    render(<CartDrawer />);
    expect(screen.queryByText('Your Cart')).not.toBeInTheDocument();
  });

  it('shows cart content when open', () => {
    useCartStore.setState({ isCartOpen: true });
    render(<CartDrawer />);
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
  });

  it('shows empty message when cart is open but empty', () => {
    useCartStore.setState({ isCartOpen: true, items: [] });
    render(<CartDrawer />);
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
  });

  it('renders cart items when cart has items', () => {
    useCartStore.setState({
      isCartOpen: true,
      items: [{ product: mockProduct, quantity: 1 }],
    });
    render(<CartDrawer />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', () => {
    useCartStore.setState({
      isCartOpen: true,
      items: [{ product: mockProduct, quantity: 2 }],
    });
    render(<CartDrawer />);
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/components/CartDrawer.test.tsx
```

Expected: FAIL — `CartDrawer` not found.

- [ ] **Step 4: Create CartDrawer**

Create `experiments/catalog-zustand/src/features/cart/components/CartDrawer.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCartStore } from '../store';
import { CartItem } from './CartItem';

export function CartDrawer() {
  const { isCartOpen, toggleCart, items, totalItems, totalPrice } = useCartStore();

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && toggleCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart ({totalItems})</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-4">Your cart is empty.</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y mt-2">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Button className="w-full" asChild>
                <Link to="/cart" onClick={toggleCart}>
                  View Cart
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 5: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/components/CartDrawer.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/components/ui/sheet.tsx \
        experiments/catalog-zustand/src/features/cart/components/CartDrawer.tsx \
        experiments/catalog-zustand/src/features/cart/components/CartDrawer.test.tsx
git commit -m "feat(catalog-zustand): add CartDrawer with shadcn Sheet"
```

---

### Task 4: CartPage

**Files:**

- Replace: `experiments/catalog-zustand/src/features/cart/CartPage.tsx`
- Create: `experiments/catalog-zustand/src/features/cart/CartPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-zustand/src/features/cart/CartPage.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useCartStore } from './store';
import { mockProduct } from '@/mocks/handlers';
import { CartPage } from './CartPage';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});

describe('CartPage', () => {
  it('renders page heading', () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Cart' })).toBeInTheDocument();
  });

  it('shows empty state when cart is empty', () => {
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('renders cart items and total', () => {
    useCartStore.setState({
      items: [{ product: mockProduct, quantity: 2 }],
    });
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });

  it('Clear Cart button empties the cart', () => {
    useCartStore.setState({
      items: [{ product: mockProduct, quantity: 1 }],
    });
    render(
      <MemoryRouter>
        <CartPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Clear Cart' }));
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/CartPage.test.tsx
```

Expected: FAIL — placeholder doesn't match.

- [ ] **Step 3: Implement CartPage**

Replace `experiments/catalog-zustand/src/features/cart/CartPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { useCartStore } from './store';
import { CartItem } from './components/CartItem';
import { Button } from '@/components/ui/button';

export function CartPage() {
  const { items, totalItems, totalPrice, clearCart } = useCartStore();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Button asChild>
            <Link to="/products">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="divide-y border rounded-lg px-4">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{totalItems} item(s)</p>
              <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearCart}>
                Clear Cart
              </Button>
              <Button asChild>
                <Link to="/products">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify tests pass**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/cart/CartPage.test.tsx
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/cart/CartPage.tsx \
        experiments/catalog-zustand/src/features/cart/CartPage.test.tsx
git commit -m "feat(catalog-zustand): implement CartPage"
```

---

### Task 5: Update Layout — badge + CartDrawer

**Files:**

- Modify: `experiments/catalog-zustand/src/components/Layout.tsx`

The header cart icon needs a badge showing `totalItems`. Mount `<CartDrawer />` inside `<Layout>` so it's available from every page.

- [ ] **Step 1: Add badge test to App.test.tsx**

Open `experiments/catalog-zustand/src/App.test.tsx` and add one test:

```tsx
it('shows item count badge after adding to cart', async () => {
  const { useCartStore } = await import('@/features/cart/store');
  useCartStore.setState({
    items: [
      {
        product: {
          id: 1,
          title: 'T',
          description: '',
          category: '',
          price: 10,
          discountPercentage: 0,
          rating: 5,
          stock: 1,
          brand: '',
          thumbnail: '',
          images: [],
        },
        quantity: 3,
      },
    ],
    isCartOpen: false,
  });
  render(<App />);
  await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/App.test.tsx
```

Expected: The new test FAILS — no badge rendered yet.

- [ ] **Step 3: Update Layout**

Replace `experiments/catalog-zustand/src/components/Layout.tsx`:

```tsx
import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/features/cart/store';
import { CartDrawer } from '@/features/cart/components/CartDrawer';

export function Layout() {
  const { totalItems, toggleCart } = useCartStore();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <Link to="/products" className="text-xl font-bold tracking-tight">
            Catalog
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={toggleCart}
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {totalItems}
              </span>
            )}
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <CartDrawer />
    </div>
  );
}
```

- [ ] **Step 4: Run App tests**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/App.test.tsx
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/components/Layout.tsx \
        experiments/catalog-zustand/src/App.test.tsx
git commit -m "feat(catalog-zustand): add cart badge and CartDrawer to Layout"
```

---

### Task 6: Wire "Add to Cart" on ProductCard + ProductDetailPage

**Files:**

- Modify: `experiments/catalog-zustand/src/features/products/components/ProductCard.tsx`
- Modify: `experiments/catalog-zustand/src/features/products/components/ProductCard.test.tsx`
- Modify: `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`
- Modify: `experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx`

- [ ] **Step 1: Add Add to Cart test to ProductCard.test.tsx**

Open `experiments/catalog-zustand/src/features/products/components/ProductCard.test.tsx`.

Add import at the top:

```tsx
import { useCartStore } from '@/features/cart/store';
```

Add `beforeEach` to reset cart before each test:

```tsx
import { beforeEach } from 'vitest';

beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});
```

Add test:

```tsx
it('clicking Add to Cart adds product to cart store', () => {
  render(
    <MemoryRouter>
      <ProductCard product={mockProduct} />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(useCartStore.getState().items).toHaveLength(1);
  expect(useCartStore.getState().items[0].product.id).toBe(mockProduct.id);
});
```

Also add `fireEvent` to the import from `@testing-library/react`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
```

- [ ] **Step 2: Run ProductCard tests to verify new test fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: New test FAILS — no Add to Cart button on card yet.

- [ ] **Step 3: Update ProductCard**

Replace `experiments/catalog-zustand/src/features/products/components/ProductCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/features/cart/store';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  return (
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
        <Button
          size="sm"
          className="mt-3 w-full"
          onClick={(e) => {
            e.preventDefault();
            addItem(product);
          }}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run ProductCard tests**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Add Add to Cart test to ProductDetailPage.test.tsx**

Open `experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx`.

Add to the imports:

```tsx
import userEvent from '@testing-library/user-event';
import { useCartStore } from '@/features/cart/store';
```

Add `beforeEach`:

```tsx
beforeEach(() => {
  useCartStore.setState({ items: [], isCartOpen: false });
  localStorage.clear();
});
```

Add test in the `describe` block:

```tsx
it('Add to Cart button adds product to cart store', async () => {
  const user = userEvent.setup();
  render(<ProductDetailPage />, { wrapper: Wrapper });
  await waitFor(() => screen.getByRole('heading', { name: 'Test Product' }));
  await user.click(screen.getByRole('button', { name: 'Add to Cart' }));
  expect(useCartStore.getState().items).toHaveLength(1);
  expect(useCartStore.getState().items[0].product.id).toBe(1);
});
```

- [ ] **Step 6: Run ProductDetailPage tests to verify new test fails**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: New test FAILS — "Add to Cart" button is still a stub.

- [ ] **Step 7: Update ProductDetailPage Add to Cart button**

Open `experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx`.

Add import:

```tsx
import { useCartStore } from '@/features/cart/store';
```

Inside `ProductDetailPage`, add after other hook calls:

```tsx
const addItem = useCartStore((state) => state.addItem);
```

Replace the existing `<Button className="flex-1">Add to Cart</Button>` (inside the button group) with:

```tsx
<Button className="flex-1" onClick={() => addItem(product)}>
  Add to Cart
</Button>
```

- [ ] **Step 8: Run ProductDetailPage tests**

```bash
cd experiments/catalog-zustand
pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: All 8 tests PASS.

- [ ] **Step 9: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/src/features/products/components/ProductCard.tsx \
        experiments/catalog-zustand/src/features/products/components/ProductCard.test.tsx \
        experiments/catalog-zustand/src/features/products/ProductDetailPage.tsx \
        experiments/catalog-zustand/src/features/products/ProductDetailPage.test.tsx
git commit -m "feat(catalog-zustand): wire Add to Cart on ProductCard and ProductDetailPage"
```

---

### Task 7: Final verification + README

- [ ] **Step 1: Run full test suite**

```bash
cd experiments/catalog-zustand
pnpm test:run
```

Expected: All tests PASS.

- [ ] **Step 2: Type-check**

```bash
cd experiments/catalog-zustand
pnpm exec tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Start dev server and verify golden path**

```bash
cd experiments/catalog-zustand
pnpm dev
```

Open http://localhost:5173 and verify:

- Clicking "Add to Cart" on a card increments the header badge
- Clicking the cart icon opens the CartDrawer with the added item
- Quantity controls in the drawer update the count
- "View Cart" link in drawer navigates to `/cart` page
- `/cart` page shows items, total, and "Clear Cart" button
- Clear Cart empties the page and shows empty state
- Adding items on the detail page works the same way
- Reloading the page preserves cart contents (localStorage persist)
- Cart state survives navigating between pages

Stop with Ctrl+C.

- [ ] **Step 4: Update README**

Replace `experiments/catalog-zustand/README.md`:

````markdown
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
````

## Copying to compare with Reatom / Effector

```bash
# From monorepo root
cp -r experiments/catalog-zustand experiments/catalog-reatom
# or
cp -r experiments/catalog-zustand experiments/catalog-effector
# Then replace src/features/cart/store.ts, src/features/ui/store.ts, and src/features/products/api.ts
```

````

- [ ] **Step 5: Commit**

```bash
cd d:/Projects/sandbox-notosrm
git add experiments/catalog-zustand/README.md
git commit -m "docs(catalog-zustand): complete README with conclusions and copy instructions"
````
