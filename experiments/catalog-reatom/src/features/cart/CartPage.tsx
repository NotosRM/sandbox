import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function CartPage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <p className="text-muted-foreground mb-4">Cart coming in Iteration 3.</p>
      <Button asChild>
        <Link to="/products">Continue shopping</Link>
      </Button>
    </div>
  );
}
