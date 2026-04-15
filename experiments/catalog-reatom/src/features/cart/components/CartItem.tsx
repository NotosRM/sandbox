import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateQuantity, removeItem } from '../atoms';
import type { CartItem as CartItemType } from '../atoms';

export const CartItem = reatomComponent<{ item: CartItemType }>(({ item }) => {
  const { product, quantity } = item;
  const [inputValue, setInputValue] = useState<string>(String(quantity));

  useEffect(() => {
    setInputValue(String(quantity));
  }, [quantity]);

  return (
    <div className="flex items-center gap-3 py-3">
      <img
        src={product.thumbnail}
        alt={product.title}
        className="w-16 h-16 rounded object-cover shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-1">{product.title}</p>
        <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
      </div>
      <Input
        type="number"
        min={1}
        value={inputValue}
        onChange={wrap((e: React.ChangeEvent<HTMLInputElement>) => {
          const raw = e.target.value;
          setInputValue(raw);
          const val = Number(raw);
          if (val > 0) updateQuantity(product.id, val);
        })}
        className="w-16 text-center"
        aria-label={`Quantity for ${product.title}`}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={wrap(() => removeItem(product.id))}
        aria-label={`Remove ${product.title}`}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}, 'CartItem');
