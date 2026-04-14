# catalog-reatom Iteration 3 — Cart

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent shopping cart: `cartItemsAtom` with `withLocalStorage`, computed totals, CartDrawer, CartItem, full CartPage, cart badge in header. Wire "Add to Cart" in ProductCard and ProductDetailPage.

**Architecture:** `features/cart/atoms.ts` owns all cart state — `cartItemsAtom` persisted via `withLocalStorage`, computed `totalItemsAtom` / `totalPriceAtom`, actions for add/remove/updateQuantity/clear. `Layout` updated with live badge and `CartDrawer`. `CartItem` and `CartDrawer` are `reatomComponent`.

**Prerequisite:** Iterations 1 and 2 complete.

**Tech Stack:** `@reatom/persist-web-storage` (withLocalStorage), `@reatom/core`, shadcn Sheet

---

## File Map

| File                                               | Action  | Responsibility                                                       |
| -------------------------------------------------- | ------- | -------------------------------------------------------------------- |
| `src/features/cart/atoms.ts`                       | create  | cartItemsAtom + withLocalStorage + computed + actions                |
| `src/features/cart/atoms.test.ts`                  | create  | Unit tests for all cart atoms and actions                            |
| `src/features/cart/components/CartItem.tsx`        | create  | reatomComponent, quantity control + remove                           |
| `src/features/cart/components/CartItem.test.tsx`   | create  | Renders item, quantity change, remove                                |
| `src/features/cart/components/CartDrawer.tsx`      | create  | reatomComponent, Sheet with cart contents                            |
| `src/features/cart/components/CartDrawer.test.tsx` | create  | Opens/closes, shows items                                            |
| `src/features/cart/CartPage.tsx`                   | replace | Full cart page (replaces placeholder)                                |
| `src/features/cart/CartPage.test.tsx`              | create  | Shows items, clear, empty state                                      |
| `src/components/Layout.tsx`                        | modify  | Add cart badge (totalItemsAtom) + CartDrawer + isCartOpenAtom toggle |
| `src/features/products/components/ProductCard.tsx` | modify  | Wire Add to Cart button                                              |
| `src/features/products/ProductDetailPage.tsx`      | modify  | Wire Add to Cart button                                              |

---

### Task 1: TDD — cart atoms

**Files:**

- Create: `src/features/cart/atoms.ts`
- Create: `src/features/cart/atoms.test.ts`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/cart/atoms.test.ts`:

```ts
import { createCtx } from '@reatom/core';
import {
  cartItemsAtom,
  totalItemsAtom,
  totalPriceAtom,
  isCartOpenAtom,
  addItem,
  removeItem,
  updateQuantity,
  clearCart,
} from './atoms';
import type { Product } from '../products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test',
  description: '',
  category: 'test',
  price: 10,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: '',
  images: [],
};

const mockProduct2: Product = { ...mockProduct, id: 2, price: 20 };

describe('cartItemsAtom defaults', () => {
  it('starts empty', () => {
    const ctx = createCtx();
    expect(ctx.get(cartItemsAtom)).toEqual([]);
  });

  it('totalItemsAtom starts at 0', () => {
    const ctx = createCtx();
    expect(ctx.get(totalItemsAtom)).toBe(0);
  });

  it('totalPriceAtom starts at 0', () => {
    const ctx = createCtx();
    expect(ctx.get(totalPriceAtom)).toBe(0);
  });

  it('isCartOpenAtom starts false', () => {
    const ctx = createCtx();
    expect(ctx.get(isCartOpenAtom)).toBe(false);
  });
});

describe('addItem', () => {
  it('adds product to cart', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    expect(ctx.get(cartItemsAtom)).toHaveLength(1);
    expect(ctx.get(cartItemsAtom)[0].product.id).toBe(1);
    expect(ctx.get(cartItemsAtom)[0].quantity).toBe(1);
  });

  it('increments quantity if product already in cart', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    addItem(ctx, mockProduct);
    expect(ctx.get(cartItemsAtom)).toHaveLength(1);
    expect(ctx.get(cartItemsAtom)[0].quantity).toBe(2);
  });

  it('updates totalItemsAtom', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    addItem(ctx, mockProduct2);
    expect(ctx.get(totalItemsAtom)).toBe(2);
  });

  it('updates totalPriceAtom', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct); // $10
    addItem(ctx, mockProduct2); // $20
    expect(ctx.get(totalPriceAtom)).toBe(30);
  });
});

describe('removeItem', () => {
  it('removes product from cart', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    removeItem(ctx, mockProduct.id);
    expect(ctx.get(cartItemsAtom)).toHaveLength(0);
  });
});

describe('updateQuantity', () => {
  it('updates quantity of existing item', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    updateQuantity(ctx, mockProduct.id, 5);
    expect(ctx.get(cartItemsAtom)[0].quantity).toBe(5);
  });

  it('removes item when quantity set to 0', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    updateQuantity(ctx, mockProduct.id, 0);
    expect(ctx.get(cartItemsAtom)).toHaveLength(0);
  });
});

describe('clearCart', () => {
  it('empties the cart', () => {
    const ctx = createCtx();
    addItem(ctx, mockProduct);
    addItem(ctx, mockProduct2);
    clearCart(ctx);
    expect(ctx.get(cartItemsAtom)).toHaveLength(0);
    expect(ctx.get(totalItemsAtom)).toBe(0);
  });
});

describe('isCartOpenAtom', () => {
  it('can be toggled', () => {
    const ctx = createCtx();
    isCartOpenAtom(ctx, true);
    expect(ctx.get(isCartOpenAtom)).toBe(true);
    isCartOpenAtom(ctx, false);
    expect(ctx.get(isCartOpenAtom)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/atoms.test.ts
```

Expected: FAIL — `./atoms` not found.

- [ ] **Step 3: Write cart atoms.ts**

Create `experiments/catalog-reatom/src/features/cart/atoms.ts`:

```ts
import { atom, action } from '@reatom/core';
import { withLocalStorage } from '@reatom/persist-web-storage';
import type { Product } from '../products/types';

export interface CartItem {
  product: Product;
  quantity: number;
}

// ─── Persisted cart items ─────────────────────────────────────────────────────

export const cartItemsAtom = atom<CartItem[]>([], 'cartItemsAtom').pipe(
  withLocalStorage('catalog-cart')
);

// ─── Computed atoms ───────────────────────────────────────────────────────────

export const totalItemsAtom = atom(
  (ctx) => ctx.spy(cartItemsAtom).reduce((sum, i) => sum + i.quantity, 0),
  'totalItemsAtom'
);

export const totalPriceAtom = atom(
  (ctx) => ctx.spy(cartItemsAtom).reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  'totalPriceAtom'
);

// ─── UI flag ──────────────────────────────────────────────────────────────────

export const isCartOpenAtom = atom(false, 'isCartOpenAtom');

// ─── Actions ─────────────────────────────────────────────────────────────────

export const addItem = action((ctx, product: Product) => {
  cartItemsAtom(ctx, (prev) => {
    const existing = prev.find((i) => i.product.id === product.id);
    if (existing) {
      return prev.map((i) =>
        i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
      );
    }
    return [...prev, { product, quantity: 1 }];
  });
}, 'addItem');

export const removeItem = action((ctx, id: number) => {
  cartItemsAtom(ctx, (prev) => prev.filter((i) => i.product.id !== id));
}, 'removeItem');

export const updateQuantity = action((ctx, id: number, qty: number) => {
  if (qty <= 0) {
    cartItemsAtom(ctx, (prev) => prev.filter((i) => i.product.id !== id));
  } else {
    cartItemsAtom(ctx, (prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, quantity: qty } : i))
    );
  }
}, 'updateQuantity');

export const clearCart = action((ctx) => {
  cartItemsAtom(ctx, []);
}, 'clearCart');
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/atoms.test.ts
```

Expected: PASS — all tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/cart/atoms.ts experiments/catalog-reatom/src/features/cart/atoms.test.ts
rtk git commit -m "feat(catalog-reatom): add cart atoms with withLocalStorage persistence"
```

---

### Task 2: TDD — CartItem

**Files:**

- Create: `src/features/cart/components/CartItem.tsx`
- Create: `src/features/cart/components/CartItem.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/cart/components/CartItem.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { CartItem } from './CartItem';
import { cartItemsAtom, addItem } from '../atoms';
import type { CartItem as CartItemType } from '../atoms';
import type { Product } from '@/features/products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: '',
  category: 'test',
  price: 10,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: 'https://example.com/img.jpg',
  images: [],
};

const mockItem: CartItemType = { product: mockProduct, quantity: 2 };

describe('CartItem', () => {
  it('renders product title and price', () => {
    renderWithReatom(<CartItem item={mockItem} />);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('renders quantity input with current value', () => {
    renderWithReatom(<CartItem item={mockItem} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
  });

  it('calls updateQuantity when quantity changes', async () => {
    const { ctx } = renderWithReatom(<CartItem item={mockItem} />);
    addItem(ctx, mockProduct);
    addItem(ctx, mockProduct); // qty = 2
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '5');
    expect(ctx.get(cartItemsAtom)[0].quantity).toBe(5);
  });

  it('calls removeItem when delete button is clicked', async () => {
    const { ctx } = renderWithReatom(<CartItem item={mockItem} />);
    addItem(ctx, mockProduct);
    await userEvent.click(screen.getByRole('button', { name: /remove test product/i }));
    expect(ctx.get(cartItemsAtom)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/components/CartItem.test.tsx
```

Expected: FAIL — `./CartItem` not found.

- [ ] **Step 3: Write CartItem**

Create `experiments/catalog-reatom/src/features/cart/components/CartItem.tsx`:

```tsx
import { Trash2 } from 'lucide-react';
import { reatomComponent } from '@reatom/npm-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateQuantity, removeItem } from '../atoms';
import type { CartItem as CartItemType } from '../atoms';

export const CartItem = reatomComponent<{ item: CartItemType }>(({ ctx, item }) => {
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
        onChange={(e) => updateQuantity(ctx, product.id, Number(e.target.value))}
        className="w-16 text-center"
        aria-label={`Quantity for ${product.title}`}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(ctx, product.id)}
        aria-label={`Remove ${product.title}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}, 'CartItem');
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/components/CartItem.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/cart/components/CartItem.tsx experiments/catalog-reatom/src/features/cart/components/CartItem.test.tsx
rtk git commit -m "feat(catalog-reatom): add CartItem reatomComponent"
```

---

### Task 3: TDD — CartDrawer

**Files:**

- Create: `src/features/cart/components/CartDrawer.tsx`
- Create: `src/features/cart/components/CartDrawer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/cart/components/CartDrawer.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { CartDrawer } from './CartDrawer';
import { isCartOpenAtom, addItem } from '../atoms';
import type { Product } from '@/features/products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: '',
  category: 'test',
  price: 99.99,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: '',
  images: [],
};

describe('CartDrawer', () => {
  it('is not visible when cart is closed', () => {
    renderWithReatom(<CartDrawer />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows empty cart message when open with no items', () => {
    const { ctx } = renderWithReatom(<CartDrawer />);
    isCartOpenAtom(ctx, true);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('shows cart item when product added', () => {
    const { ctx } = renderWithReatom(<CartDrawer />);
    addItem(ctx, mockProduct);
    isCartOpenAtom(ctx, true);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', () => {
    const { ctx } = renderWithReatom(<CartDrawer />);
    addItem(ctx, mockProduct);
    isCartOpenAtom(ctx, true);
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('closes when sheet is dismissed', async () => {
    const { ctx } = renderWithReatom(<CartDrawer />);
    isCartOpenAtom(ctx, true);
    // Sheet close button (×)
    await userEvent.keyboard('{Escape}');
    expect(ctx.get(isCartOpenAtom)).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/components/CartDrawer.test.tsx
```

Expected: FAIL — `./CartDrawer` not found.

- [ ] **Step 3: Write CartDrawer**

Create `experiments/catalog-reatom/src/features/cart/components/CartDrawer.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { reatomComponent } from '@reatom/npm-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, totalItemsAtom, totalPriceAtom, isCartOpenAtom } from '../atoms';
import { CartItem } from './CartItem';

export const CartDrawer = reatomComponent(({ ctx }) => {
  const isOpen = ctx.spy(isCartOpenAtom);
  const items = ctx.spy(cartItemsAtom);
  const totalItems = ctx.spy(totalItemsAtom);
  const totalPrice = ctx.spy(totalPriceAtom);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => isCartOpenAtom(ctx, open)}>
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
                <Link to="/cart" onClick={() => isCartOpenAtom(ctx, false)}>
                  View Cart
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}, 'CartDrawer');
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/components/CartDrawer.test.tsx
```

Expected: PASS — 5 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/cart/components/CartDrawer.tsx experiments/catalog-reatom/src/features/cart/components/CartDrawer.test.tsx
rtk git commit -m "feat(catalog-reatom): add CartDrawer reatomComponent"
```

---

### Task 4: TDD — CartPage (replace placeholder)

**Files:**

- Replace: `src/features/cart/CartPage.tsx`
- Create: `src/features/cart/CartPage.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `experiments/catalog-reatom/src/features/cart/CartPage.test.tsx`:

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithReatom } from '@/test/utils';
import { CartPage } from './CartPage';
import { addItem, cartItemsAtom } from './atoms';
import type { Product } from '../products/types';

const mockProduct: Product = {
  id: 1,
  title: 'Test Product',
  description: '',
  category: 'test',
  price: 50,
  discountPercentage: 0,
  rating: 5,
  stock: 100,
  brand: 'Brand',
  thumbnail: '',
  images: [],
};

describe('CartPage', () => {
  it('shows empty state with continue shopping link', () => {
    renderWithReatom(<CartPage />);
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('shows cart item when product in cart', () => {
    const { ctx } = renderWithReatom(<CartPage />);
    addItem(ctx, mockProduct);
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', () => {
    const { ctx } = renderWithReatom(<CartPage />);
    addItem(ctx, mockProduct);
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('clears cart on Clear Cart click', async () => {
    const { ctx } = renderWithReatom(<CartPage />);
    addItem(ctx, mockProduct);
    await userEvent.click(screen.getByRole('button', { name: /clear cart/i }));
    expect(ctx.get(cartItemsAtom)).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/CartPage.test.tsx
```

Expected: FAIL — CartPage is a placeholder with no cart logic.

- [ ] **Step 3: Replace CartPage**

Replace `experiments/catalog-reatom/src/features/cart/CartPage.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { reatomComponent } from '@reatom/npm-react';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, totalItemsAtom, totalPriceAtom, clearCart } from './atoms';
import { CartItem } from './components/CartItem';

export const CartPage = reatomComponent(({ ctx }) => {
  const items = ctx.spy(cartItemsAtom);
  const totalItems = ctx.spy(totalItemsAtom);
  const totalPrice = ctx.spy(totalPriceAtom);

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
              <Button variant="outline" onClick={() => clearCart(ctx)}>
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
}, 'CartPage');
```

- [ ] **Step 4: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/CartPage.test.tsx
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/cart/CartPage.tsx experiments/catalog-reatom/src/features/cart/CartPage.test.tsx
rtk git commit -m "feat(catalog-reatom): add full CartPage reatomComponent"
```

---

### Task 5: Update Layout — cart badge + CartDrawer

**Files:**

- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Update Layout.tsx**

Replace `experiments/catalog-reatom/src/components/Layout.tsx`:

```tsx
import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { reatomComponent } from '@reatom/npm-react';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { totalItemsAtom, isCartOpenAtom } from '@/features/cart/atoms';

export const Layout = reatomComponent(({ ctx }) => {
  const totalItems = ctx.spy(totalItemsAtom);

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
            onClick={() => isCartOpenAtom(ctx, true)}
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
}, 'Layout');
```

- [ ] **Step 2: Update App.tsx import**

In `experiments/catalog-reatom/src/App.tsx`, `Layout` is now a named export from a `reatomComponent`. The import stays the same (`import { Layout } from '@/components/Layout'`). No change needed if it was already a named export.

- [ ] **Step 3: Run full test suite to verify no regressions**

```bash
cd experiments/catalog-reatom && pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
rtk git add experiments/catalog-reatom/src/components/Layout.tsx
rtk git commit -m "feat(catalog-reatom): wire cart badge and CartDrawer in Layout"
```

---

### Task 6: Wire Add to Cart in ProductCard and ProductDetailPage

**Files:**

- Modify: `src/features/products/components/ProductCard.tsx`
- Modify: `src/features/products/ProductDetailPage.tsx`

- [ ] **Step 1: Write test for ProductCard Add to Cart**

Append to `experiments/catalog-reatom/src/features/products/components/ProductCard.test.tsx`:

```tsx
import { cartItemsAtom } from '@/features/cart/atoms';
import { mockProduct } from '@/mocks/handlers';

it('Add to Cart button adds product to cart', async () => {
  const { ctx } = renderWithReatom(<ProductCard product={mockProduct} />);
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(ctx.get(cartItemsAtom)).toHaveLength(1);
  expect(ctx.get(cartItemsAtom)[0].product.id).toBe(mockProduct.id);
});

it('Add to Cart button shows "In Cart" after adding', async () => {
  const { ctx } = renderWithReatom(<ProductCard product={mockProduct} />);
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(screen.getByRole('button', { name: /in cart/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: FAIL — button is disabled, tests fail.

- [ ] **Step 3: Update ProductCard**

Replace `experiments/catalog-reatom/src/features/products/components/ProductCard.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { reatomComponent } from '@reatom/npm-react';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, addItem } from '@/features/cart/atoms';
import type { Product } from '../types';

export const ProductCard = reatomComponent<{ product: Product }>(({ ctx, product }) => {
  const isInCart = ctx.spy(cartItemsAtom).some((i) => i.product.id === product.id);

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
          variant={isInCart ? 'secondary' : 'default'}
          onClick={(e) => {
            e.preventDefault();
            addItem(ctx, product);
          }}
        >
          {isInCart ? 'In Cart' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}, 'ProductCard');
```

- [ ] **Step 4: Run ProductCard tests to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/components/ProductCard.test.tsx
```

Expected: PASS — all tests including the 2 new ones.

- [ ] **Step 5: Write test for ProductDetailPage Add to Cart**

Append to `experiments/catalog-reatom/src/features/products/ProductDetailPage.test.tsx`:

```tsx
import { cartItemsAtom } from '@/features/cart/atoms';

it('Add to Cart button adds product to cart', async () => {
  const { ctx } = renderWithReatom(<ProductDetailPage />, {
    route: '/products/1',
    routePath: '/products/:id',
  });
  await waitFor(() => screen.getByRole('button', { name: /add to cart/i }));
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(ctx.get(cartItemsAtom)).toHaveLength(1);
});
```

- [ ] **Step 6: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: FAIL — button is disabled.

- [ ] **Step 7: Update ProductDetailPage Add to Cart**

In `experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx`:

Add to imports: `import { addItem } from '@/features/cart/atoms';`

Replace `{/* Add to Cart wired in Iteration 3 */}` comment with:

```tsx
<Button className="flex-1" onClick={() => product && addItem(ctx, product)}>
  Add to Cart
</Button>
```

- [ ] **Step 8: Run to verify pass**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: PASS — all tests.

- [ ] **Step 9: Commit**

```bash
rtk git add experiments/catalog-reatom/src/features/products/components/ProductCard.tsx experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx
rtk git commit -m "feat(catalog-reatom): wire Add to Cart in ProductCard and ProductDetailPage"
```

---

### Task 7: Final test run + README

- [ ] **Step 1: Run full test suite**

```bash
cd experiments/catalog-reatom && pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 2: Update README.md**

Update `experiments/catalog-reatom/README.md` with status `complete` and conclusions:

```markdown
# catalog-reatom

| Field    | Value                                                                                                                                         |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Template | react-full                                                                                                                                    |
| Created  | 2026-04-14                                                                                                                                    |
| Status   | complete                                                                                                                                      |
| Goal     | Port catalog-zustand to idiomatic Reatom v3: reatomAsync/reatomResource for server state, atoms for client state, reatomComponent throughout. |

## Выводы

- `reatomResource` — прямой аналог `useQuery` с реактивными зависимостями через `ctx.spy`. При смене фильтра ресурс пересчитывается автоматически — не нужны query keys.
- `reatomComponent` — компонент с fine-grained подписками. Не нужны `useMemo`/`useCallback`/селекторы. Re-render только при изменении конкретно тех атомов, которые spy-тся.
- `withLocalStorage` — однострочная персистентность вместо middleware Zustand.
- Мутации как `action` — явные, без магии. Optimistic update = прямая запись в `dataAtom`; rollback = re-bump refresh atom.
- Boilerplate: больше, чем в Zustand (нужен ctx везде), но логика более предсказуема и тестируема изолированно.
```

- [ ] **Step 3: Final commit**

```bash
rtk git add experiments/catalog-reatom/README.md
rtk git commit -m "docs(catalog-reatom): iter3 complete — persistent cart, experiment README"
```
