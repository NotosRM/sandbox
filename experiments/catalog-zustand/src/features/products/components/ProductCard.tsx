import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="block rounded-lg border p-4 hover:shadow-md transition-shadow bg-card"
    >
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-full h-48 object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold line-clamp-1">{product.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold">${product.price.toFixed(2)}</span>
        <span className="text-xs text-muted-foreground capitalize">{product.category}</span>
      </div>
    </Link>
  );
}
