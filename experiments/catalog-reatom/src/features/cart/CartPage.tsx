import { Link } from 'react-router-dom';
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, totalItemsAtom, totalPriceAtom, clearCart } from './atoms';
import { CartItem } from './components/CartItem';

export const CartPage = reatomComponent(() => {
  const items = cartItemsAtom();
  const totalItems = totalItemsAtom();
  const totalPrice = totalPriceAtom();

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Cart</h1>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Your cart is empty.</p>
          <Button asChild>
            <Link to="/products">Continue shopping</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="divide-y border rounded-lg px-4">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{totalItems} item(s)</p>
              <p className="text-2xl font-bold">${totalPrice.toFixed(2)}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={wrap(clearCart)}>
                Clear Cart
              </Button>
              <Button asChild>
                <Link to="/products">Continue shopping</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}, 'CartPage');
