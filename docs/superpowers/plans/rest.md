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
    const { frame } = renderWithReatom(<CartDrawer />);
    frame.run(() => isCartOpenAtom.set(true));
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it('shows cart item when product added', () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    frame.run(() => {
      addItem(mockProduct);
      isCartOpenAtom.set(true);
    });
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    frame.run(() => {
      addItem(mockProduct);
      isCartOpenAtom.set(true);
    });
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('closes when sheet is dismissed', async () => {
    const { frame } = renderWithReatom(<CartDrawer />);
    frame.run(() => isCartOpenAtom.set(true));
    await userEvent.keyboard('{Escape}');
    frame.run(() => expect(isCartOpenAtom()).toBe(false));
  });
});
```

**Изменения vs v3:** `isCartOpenAtom(ctx, true)` → `frame.run(() => isCartOpenAtom.set(true))`, `addItem(ctx, product)` → `frame.run(() => addItem(product))`, `ctx.get(isCartOpenAtom)` → `frame.run(() => isCartOpenAtom())`.

- [ ] **Step 2: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/cart/components/CartDrawer.test.tsx
```

Expected: FAIL — `./CartDrawer` not found.

- [ ] **Step 3: Write CartDrawer**

Create `experiments/catalog-reatom/src/features/cart/components/CartDrawer.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, totalItemsAtom, totalPriceAtom, isCartOpenAtom } from '../atoms';
import { CartItem } from './CartItem';

export const CartDrawer = reatomComponent(() => {
  const isOpen = isCartOpenAtom();
  const items = cartItemsAtom();
  const totalItems = totalItemsAtom();
  const totalPrice = totalPriceAtom();

  return (
    <Sheet open={isOpen} onOpenChange={wrap((open) => isCartOpenAtom.set(open))}>
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
                <Link to="/cart" onClick={wrap(() => isCartOpenAtom.set(false))}>
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

**Изменения vs v3:** `({ ctx })` → `()`, `ctx.spy(atom)` → `atom()`, `isCartOpenAtom(ctx, open)` → `wrap((open) => isCartOpenAtom.set(open))`.

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
    const { frame } = renderWithReatom(<CartPage />);
    frame.run(() => addItem(mockProduct));
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('shows total price', () => {
    const { frame } = renderWithReatom(<CartPage />);
    frame.run(() => addItem(mockProduct));
    expect(screen.getByText('$50.00')).toBeInTheDocument();
  });

  it('clears cart on Clear Cart click', async () => {
    const { frame } = renderWithReatom(<CartPage />);
    frame.run(() => addItem(mockProduct));
    await userEvent.click(screen.getByRole('button', { name: /clear cart/i }));
    frame.run(() => expect(cartItemsAtom()).toHaveLength(0));
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
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, totalItemsAtom, totalPriceAtom, clearCart } from './atoms';
import { CartItem } from './components/CartItem';

export const CartPage = reatomComponent(() => {
  const items = cartItemsAtom();
  const totalItems = totalItemsAtom();
  const totalPrice = totalPriceAtom();

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
              <Button variant="outline" onClick={wrap(clearCart)}>
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

**Изменения vs v3:** `({ ctx })` → `()`, `ctx.spy(atom)` → `atom()`, `clearCart(ctx)` → `wrap(clearCart)`.

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
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/features/cart/components/CartDrawer';
import { totalItemsAtom, isCartOpenAtom } from '@/features/cart/atoms';

export const Layout = reatomComponent(() => {
  const totalItems = totalItemsAtom();

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
            onClick={wrap(() => isCartOpenAtom.set(true))}
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

**Изменения vs v3:** `({ ctx })` → `()`, `ctx.spy(totalItemsAtom)` → `totalItemsAtom()`, `isCartOpenAtom(ctx, true)` → `wrap(() => isCartOpenAtom.set(true))`.

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
  const { frame } = renderWithReatom(<ProductCard product={mockProduct} />);
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  frame.run(() => {
    expect(cartItemsAtom()).toHaveLength(1);
    expect(cartItemsAtom()[0].product.id).toBe(mockProduct.id);
  });
});

it('Add to Cart button shows "In Cart" after adding', async () => {
  renderWithReatom(<ProductCard product={mockProduct} />);
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
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, addItem } from '@/features/cart/atoms';
import type { Product } from '../types';

export const ProductCard = reatomComponent<{ product: Product }>(({ product }) => {
  const isInCart = cartItemsAtom().some((i) => i.product.id === product.id);

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
          onClick={wrap((e) => {
            e.preventDefault();
            addItem(product);
          })}
        >
          {isInCart ? 'In Cart' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}, 'ProductCard');
```

**Изменения vs v3:** `ctx.spy(cartItemsAtom)` → `cartItemsAtom()`, `addItem(ctx, product)` → `addItem(product)`, onClick обёрнут в `wrap()`.

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
  const { frame } = renderWithReatom(<ProductDetailPage />, {
    route: '/products/1',
    routePath: '/products/:id',
  });
  await waitFor(() => screen.getByRole('button', { name: /add to cart/i }));
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  frame.run(() => expect(cartItemsAtom()).toHaveLength(1));
});
```

- [ ] **Step 6: Run to verify failure**

```bash
cd experiments/catalog-reatom && pnpm test:run -- src/features/products/ProductDetailPage.test.tsx
```

Expected: FAIL — button is disabled.

- [ ] **Step 7: Update ProductDetailPage Add to Cart**

In `experiments/catalog-reatom/src/features/products/ProductDetailPage.tsx`:

Add to imports:

```tsx
import { wrap } from '@reatom/core';
import { addItem } from '@/features/cart/atoms';
```

Replace `{/* Add to Cart wired in Iteration 3 */}` comment with:

```tsx
<Button className="flex-1" onClick={wrap(() => product && addItem(product))}>
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

| Field    | Value                                                                                                                                        |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Template | react-full                                                                                                                                   |
| Created  | 2026-04-14                                                                                                                                   |
| Status   | complete                                                                                                                                     |
| Goal     | Port catalog-zustand to idiomatic Reatom v1000: computed+withAsyncData для server state, atoms для client state, reatomComponent throughout. |

## Выводы

- `computed(async () => { dep() }) + withAsyncData` — прямой аналог `reatomResource + withDataAtom/withErrorAtom/withStatusesAtom` из v3. Реактивность та же: смена зависимости пересчитывает ресурс автоматически.
- `reatomComponent` — компонент без `ctx`-пропса. Атомы читаются вызовом `atom()`, fine-grained подписки. Re-render только при изменении конкретно тех атомов, которые вызывались в рендере.
- `withLocalStorage` переехал из `@reatom/persist-web-storage` прямо в `@reatom/core`. Синтаксис сменился с `.pipe()` на `.extend()`.
- `computed(...)` — отдельная функция вместо `atom((ctx) => ctx.spy(...))`. Читаемее, типобезопасность лучше.
- Обработчики событий требуют `wrap()` для сохранения реактивного контекста. Альтернатива — `useAction()` для стабильных ссылок.
- Тесты: `createCtx()` → `context.start()`, операции в `frame.run()`. Немного многословнее, зато изоляция явная.
- Boilerplate: `ctx` ушёл из аргументов — код компонентов и экшенов значительно чище.
```

- [ ] **Step 3: Final commit**

```bash
rtk git add experiments/catalog-reatom/README.md
rtk git commit -m "docs(catalog-reatom): iter3 complete — persistent cart, experiment README"
```
