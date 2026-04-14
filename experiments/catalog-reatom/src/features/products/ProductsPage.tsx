import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './components/ProductCard';
import { ProductFilters } from './components/ProductFilters';
import { ProductForm } from './components/ProductForm';
import { productsResource, pageAtom, LIMIT, openCreateForm } from './atoms';

export const ProductsPage = reatomComponent(() => {
  const data = productsResource.data();
  const { isPending } = productsResource.status();
  const error = productsResource.error();
  const page = pageAtom();
  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;

  if (error) {
    return <p className="text-destructive">Failed to load products.</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={wrap(openCreateForm)}>New Product</Button>
      </div>
      <ProductFilters />
      {isPending && !data ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <>
          {!data?.products.length ? (
            <p className="text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={wrap(() => pageAtom.set(page - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={wrap(() => pageAtom.set(page + 1))}
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
}, 'ProductsPage');
