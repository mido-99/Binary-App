import { useCartStore } from "@/stores/cartStore";

export function CartSummary() {
  const total = useCartStore((s) => s.getTotal());
  const itemCount = useCartStore((s) => s.getItemCount());

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Subtotal ({itemCount} item{itemCount !== 1 ? "s" : ""})</span>
        <span className="font-heading font-bold">${total}</span>
      </div>
    </div>
  );
}
