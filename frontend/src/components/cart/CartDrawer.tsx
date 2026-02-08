import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "@/stores/uiStore";
import { useCartStore } from "@/stores/cartStore";
import { useCartHydrate } from "@/hooks/useCartHydrate";
import { Button } from "@/components/ui/button";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { EmptyCart } from "./EmptyCart";
import { X } from "lucide-react";

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen } = useUIStore();
  const items = useCartStore((s) => s.items);
  useCartHydrate(cartDrawerOpen);

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setCartDrawerOpen(false)}
            aria-hidden
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-card shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="font-heading text-lg font-semibold">Cart</h2>
              <Button variant="ghost" size="icon" onClick={() => setCartDrawerOpen(false)} aria-label="Close cart">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <EmptyCart />
              ) : (
                <div className="space-y-0">
                  {items.map((item) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t p-4 space-y-4">
                <CartSummary />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" asChild onClick={() => setCartDrawerOpen(false)}>
                    <Link to="/cart">View full cart</Link>
                  </Button>
                  <Button className="flex-1" asChild onClick={() => setCartDrawerOpen(false)}>
                    <Link to="/checkout">Checkout</Link>
                  </Button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
