import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCartStore } from "@/stores/cartStore";
import { useCartHydrate } from "@/hooks/useCartHydrate";
import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { EmptyCart } from "@/components/cart/EmptyCart";

export function CartPage() {
  const items = useCartStore((s) => s.items);
  useCartHydrate(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      <h1 className="font-heading text-3xl font-bold tracking-tight">Shopping cart</h1>
      <p className="mt-2 text-muted-foreground">
        {items.length === 0
          ? "Your cart is empty."
          : `${items.length} item${items.length === 1 ? "" : "s"} in your cart.`}
      </p>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="px-4">
                  <CartItem item={item} />
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-card p-4">
              <CartSummary />
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button asChild className="flex-1">
                  <Link to="/checkout">Proceed to checkout</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
