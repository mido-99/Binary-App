import { memo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { WishlistButton } from "@/components/store/WishlistButton";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
  layout?: "grid" | "list";
}

function ProductCardInner({ product, index = 0, layout = "grid" }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const displayPrice = product.sale_price ?? product.markup_price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product.id, {
      id: product.id,
      name: product.name,
      markup_price: product.markup_price,
      sale_price: product.sale_price,
      store_name: product.store_name,
    });
  };

  if (layout === "list") {
    return (
      <motion.li
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: index * 0.02 }}
      >
        <Link to={`/item/${product.id}`}>
          <motion.div
            whileHover={{ x: 4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Card className="overflow-hidden group cursor-pointer flex flex-row h-28 relative">
              <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
                <WishlistButton productId={product.id} size="icon" className="h-8 w-8" />
              </div>
              <div className="w-28 shrink-0 bg-muted/50 flex items-center justify-center text-muted-foreground text-3xl font-heading font-bold group-hover:bg-muted transition-colors">
                {product.name.charAt(0).toUpperCase()}
              </div>
              <CardContent className="p-4 flex flex-1 flex-col justify-center min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {product.category_display}
                </span>
                <h2 className="font-heading text-lg font-bold group-hover:text-primary transition-colors truncate">
                  {product.name}
                </h2>
                <p className="text-sm text-muted-foreground truncate flex-1">
                  {product.description || "No description."}
                </p>
                <div className="flex items-baseline justify-between gap-2 mt-1 flex-wrap">
                  <span className="font-heading text-xl font-bold">${displayPrice}</span>
                  {product.sale_price != null && (
                    <span className="text-sm text-muted-foreground line-through">${product.markup_price}</span>
                  )}
                  <span className="text-xs text-muted-foreground truncate">{product.store_name}</span>
                  <Button size="sm" variant="outline" className="shrink-0" onClick={handleAddToCart}>
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Link>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
    >
      <Link to={`/item/${product.id}`}>
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Card className="overflow-hidden h-full group cursor-pointer relative">
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
              <WishlistButton productId={product.id} size="icon" className="h-8 w-8" />
            </div>
            <div className="aspect-square bg-muted/50 flex items-center justify-center text-muted-foreground text-5xl font-heading font-bold group-hover:bg-muted transition-colors">
              {product.name.charAt(0).toUpperCase()}
            </div>
            <CardContent className="p-5">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {product.category_display}
              </span>
              <h2 className="mt-2 font-heading text-xl font-bold group-hover:text-primary transition-colors">
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                {product.description || "No description."}
              </p>
              <div className="mt-4 flex items-baseline justify-between gap-2 flex-wrap">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-2xl font-bold">${displayPrice}</span>
                  {product.sale_price != null && (
                    <span className="text-sm text-muted-foreground line-through">${product.markup_price}</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">{product.store_name}</span>
              </div>
              <Button
                size="sm"
                className="mt-4 w-full"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to cart
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    </motion.li>
  );
}

export const ProductCard = memo(ProductCardInner);
