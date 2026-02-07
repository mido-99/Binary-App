import { AnimatePresence } from "framer-motion";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/types";

interface ProductGridProps {
  products: Product[];
  layout?: "grid" | "list";
}

export function ProductGrid({ products, layout = "grid" }: ProductGridProps) {
  return (
    <AnimatePresence mode="popLayout">
      {layout === "list" ? (
        <ul className="space-y-3" role="list">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} layout="list" />
          ))}
        </ul>
      ) : (
        <ul
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8"
          role="list"
        >
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} layout="grid" />
          ))}
        </ul>
      )}
    </AnimatePresence>
  );
}
