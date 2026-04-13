import { useState } from 'react';
import { useProducts } from './api';
import { ProductCard } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/features/ui/store';
import { ProductForm } from './components/ProductForm';

const LIMIT = 12;

export function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { openCreateForm } = useUIStore();
  const { data, isLoading, isError } = useProducts({ page, limit: LIMIT, search, category });
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleCategoryChange(value: string) {
    setCategory(value);
    setPage(1);
  }

  if (isError) {
    return <p className="text-destructive">Failed to load products.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={openCreateForm}>New Product</Button>
      </div>
      <ProductFilters
        search={search}
        onSearchChange={handleSearchChange}
        category={category}
        onCategoryChange={handleCategoryChange}
      />
      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {data?.products.length === 0 ? (
            <p className="text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
      <ProductForm />
    </div>
  );
}
