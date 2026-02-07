import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingBag className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <p className="text-muted-foreground font-medium">Your cart is empty</p>
      <p className="text-sm text-muted-foreground mt-1">Add items from the shop to get started.</p>
      <Button asChild className="mt-6">
        <Link to="/">Continue shopping</Link>
      </Button>
    </div>
  );
}
