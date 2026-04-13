import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export function Layout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <Link to="/products" className="text-xl font-bold tracking-tight">
            Catalog
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
