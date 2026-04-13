import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '../store';
import type { CartItem as CartItemType } from '../store';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCartStore();
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
        onChange={(e) => updateQuantity(product.id, Number(e.target.value))}
        className="w-16 text-center"
        aria-label={`Quantity for ${product.title}`}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => removeItem(product.id)}
        aria-label={`Remove ${product.title}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}
