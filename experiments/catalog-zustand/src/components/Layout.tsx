import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <Link to="/products" className="text-xl font-bold tracking-tight">
            Catalog
          </Link>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/cart" aria-label="Cart">
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
