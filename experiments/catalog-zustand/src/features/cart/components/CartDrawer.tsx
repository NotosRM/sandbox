import { Link } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCartStore } from '../store';
import { CartItem } from './CartItem';

export function CartDrawer() {
  const { isCartOpen, toggleCart, items, totalItems, totalPrice } = useCartStore();

  if (!isCartOpen) return null;

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && toggleCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            <span>Your Cart</span> <span>({totalItems})</span>
          </SheetTitle>
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
                <Link to="/cart" onClick={toggleCart}>
                  View Cart
                </Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
