import { Link } from 'react-router-dom';
import { wrap } from '@reatom/core';
import { reatomComponent } from '@reatom/react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cartItemsAtom, totalItemsAtom, totalPriceAtom, isCartOpenAtom } from '../atoms';
import { CartItem } from './CartItem';

export const CartDrawer = reatomComponent(() => {
  const isOpen = isCartOpenAtom();
  const items = cartItemsAtom();
  const totalItems = totalItemsAtom();
  const totalPrice = totalPriceAtom();

  return (
    <Sheet open={isOpen} onOpenChange={wrap((open) => isCartOpenAtom.set(open))}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your Cart ({totalItems})</SheetTitle>
        </SheetHeader>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-4">Your cart is empty.</p>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y mt-2">
              {items.map((item) => (
                <CartItem key={item.product.id} item={item} />
              ))}
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Button className="w-full" asChild>
                <Link to="/cart" onClick={wrap(() => isCartOpenAtom.set(false))}>
                  View Cart
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}, 'CartDrawer');
