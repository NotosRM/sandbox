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
