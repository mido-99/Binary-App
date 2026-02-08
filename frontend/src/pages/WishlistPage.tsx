import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "@/types";

export function WishlistPage() {
  const queryClient = useQueryClient();
  const addItem = useCartStore((s) => s.addItem);

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get("/api/wishlist/");
      return data;
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId: number) => {
      await api.delete(`/api/wishlist/${productId}/remove/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
  });

  const products = data?.products ?? [];

  const handleAddAllToCart = () => {
    products.forEach((p) => {
      addItem(p.id, {
        id: p.id,
        name: p.name,
        markup_price: p.markup_price,
        sale_price: p.sale_price,
        store_name: p.store_name,
      });
    });
    toast.success(`Added ${products.length} item(s) to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Wishlist</h1>
          <p className="text-muted-foreground mt-1">
            {products.length === 0 ? "No saved items." : `${products.length} item(s) saved.`}
          </p>
        </div>
        {products.length > 0 && (
          <Button onClick={handleAddAllToCart}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add all to cart
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-lg bg-muted animate-pulse aspect-square" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">Your wishlist is empty.</p>
          <Button asChild className="mt-4">
            <Link to="/">Browse products</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product, i) => {
            const displayPrice = product.sale_price ?? product.markup_price;
            return (
              <motion.li
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="overflow-hidden h-full group">
                  <Link to={`/item/${product.id}`}>
                    <div className="aspect-square bg-muted/50 flex items-center justify-center text-4xl font-heading font-bold text-muted-foreground group-hover:bg-muted transition-colors overflow-hidden">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        product.name.charAt(0).toUpperCase()
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/item/${product.id}`}>
                      <h2 className="font-heading font-bold truncate group-hover:text-primary">{product.name}</h2>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">${displayPrice}</p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          addItem(product.id, {
                            id: product.id,
                            name: product.name,
                            markup_price: product.markup_price,
                            sale_price: product.sale_price,
                            store_name: product.store_name,
                            image_url: product.image_url,
                            store_id: product.store_id,
                            seller_id: product.seller_id,
                          });
                          toast.success("Added to cart");
                        }}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Add to cart
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.preventDefault();
                          removeFromWishlist.mutate(product.id);
                        }}
                        disabled={removeFromWishlist.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
