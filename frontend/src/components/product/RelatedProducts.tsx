import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/types";

interface RelatedProductsProps {
  products: Product[];
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <div>
      <h2 className="font-heading text-xl font-bold tracking-tight mb-4">Related products</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product, i) => {
          const displayPrice = product.sale_price ?? product.markup_price;
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/item/${product.id}`}>
                <Card className="overflow-hidden h-full group cursor-pointer">
                  <div className="aspect-square bg-muted/50 flex items-center justify-center text-2xl font-heading font-bold text-muted-foreground group-hover:bg-muted transition-colors overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      product.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                      {product.name}
                    </p>
                    <p className="font-heading font-bold text-sm">${displayPrice}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
