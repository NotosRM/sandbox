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
