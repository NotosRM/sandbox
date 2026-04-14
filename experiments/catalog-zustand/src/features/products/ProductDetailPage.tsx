import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct, useDeleteProduct } from './api';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/features/ui/store';
import { useCartStore } from '@/features/cart/store';
import { ProductForm } from './components/ProductForm';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, isError } = useProduct(Number(id ?? 0));
  const navigate = useNavigate();
  const { openEditForm } = useUIStore();
  const addItem = useCartStore((state) => state.addItem);
  const deleteMutation = useDeleteProduct();

  async function handleDelete() {
    if (!product) return;
    await deleteMutation.mutateAsync(product.id);
    navigate('/products');
  }

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (isError || !product) return <p className="text-destructive">Product not found.</p>;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/products"
        className="text-sm text-muted-foreground hover:underline mb-6 block"
        aria-label="Back to products"
      >
        ← Back to products
      </Link>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.thumbnail}
            alt={product.title}
            className="w-full rounded-lg object-cover aspect-square"
          />
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
              {product.images.slice(1).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.title} ${i + 2}`}
                  className="w-20 h-20 rounded object-cover shrink-0"
                />
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            {product.description}
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
            {product.discountPercentage > 0 && (
              <span className="text-sm text-green-600 font-medium">
                -{product.discountPercentage.toFixed(0)}%
              </span>
            )}
          </div>
          <div className="mt-3 space-y-1 text-sm text-muted-foreground">
            <p>
              Category: <span className="capitalize text-foreground">{product.category}</span>
            </p>
            <p>
              Brand: <span className="text-foreground">{product.brand}</span>
            </p>
            <p>In stock: {product.stock}</p>
            <p>Rating: {product.rating} / 5</p>
          </div>
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
            <Button className="flex-1" onClick={() => addItem(product)}>
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
      <ProductForm />
    </div>
  );
}
