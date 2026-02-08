import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/cartStore";
import { useUIStore } from "@/stores/uiStore";
import { WishlistButton } from "@/components/store/WishlistButton";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ShoppingCart, Share2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { ProductDetail } from "@/types";

interface ProductDetailResponse extends ProductDetail {
  related_products?: import("@/types").Product[];
}

export function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = id ? parseInt(id, 10) : NaN;
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleCartDrawer = useUIStore((s) => s.toggleCartDrawer);

  const { data: product, isLoading, error } = useQuery<ProductDetailResponse>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data } = await api.get(`/api/products/${productId}/`);
      return data;
    },
    enabled: Number.isInteger(productId),
  });

  if (!Number.isInteger(productId)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-dashed p-12 text-center"
      >
        <p className="text-muted-foreground">Invalid item.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Back to shop</Link>
        </Button>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-10 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-20 bg-muted rounded w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-dashed p-12 text-center"
      >
        <p className="text-muted-foreground">Item not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Back to shop</Link>
        </Button>
      </motion.div>
    );
  }

  const displayPrice = product.sale_price ?? product.markup_price;
  const hasDiscount =
    product.sale_price != null ||
    (product.discount_percent != null && Number(product.discount_percent) > 0);

  const storeName = product.store?.name ?? product.store_name;
  const handleAddToCart = () => {
    addItem(product.id, {
      id: product.id,
      name: product.name,
      markup_price: product.markup_price,
      sale_price: product.sale_price,
      store_name: storeName,
      image_url: product.image_url,
      store_id: product.store?.id,
      seller_id: product.seller?.id,
    }, quantity);
    toast.success("Added to cart");
    toggleCartDrawer();
  };

  const handleBuyNow = () => {
    addItem(product.id, {
      id: product.id,
      name: product.name,
      markup_price: product.markup_price,
      sale_price: product.sale_price,
      store_name: storeName,
      image_url: product.image_url,
      store_id: product.store?.id,
      seller_id: product.seller?.id,
    }, quantity);
    navigate("/checkout");
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } else {
      toast.info(url);
    }
  };

  const relatedProducts = product.related_products ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground underline">
          Shop
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="aspect-square rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground text-8xl font-heading font-bold overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt="" className="w-full h-full object-cover rounded-2xl" />
          ) : (
            product.name.charAt(0).toUpperCase()
          )}
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {product.category_display}
            </span>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">{product.name}</h1>
            {(product.store || product.store_name) && (
              <p className="mt-1 text-sm text-muted-foreground">
                Sold by{" "}
                {product.seller ? (
                  <Link to={`/seller/${product.seller.id}`} className="underline hover:text-foreground">
                    {product.seller.email}
                  </Link>
                ) : (
                  "—"
                )}
                {" store: "}
                {product.store ? (
                  <Link to={`/store/${product.store.id}`} className="underline hover:text-foreground">
                    {product.store.name}
                  </Link>
                ) : (
                  product.store_name
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-heading text-3xl font-bold">${displayPrice}</span>
            {hasDiscount && (
              <>
                {product.markup_price && product.sale_price && (
                  <span className="text-lg text-muted-foreground line-through">${product.markup_price}</span>
                )}
                {product.discount_percent && Number(product.discount_percent) > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-sm font-medium text-primary">
                    {product.discount_percent}% off
                  </span>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium tabular-nums">{quantity}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="flex-1 min-w-[140px]" onClick={handleAddToCart}>
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to cart
            </Button>
            <Button size="lg" variant="outline" className="flex-1 min-w-[140px]" onClick={handleBuyNow}>
              Buy now
            </Button>
            <Button size="lg" variant="ghost" className="shrink-0 p-2" onClick={handleShare} aria-label="Share">
              <Share2 className="h-4 w-4" />
            </Button>
            <WishlistButton productId={productId} size="lg" className="shrink-0 p-2" />
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.full_description || product.description || "No description."}
            </p>
          </div>

        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="font-heading text-sm font-semibold mb-2">Pricing details</h2>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Base price</dt>
            <dd>${product.base_price}</dd>
            <dt className="text-muted-foreground">List price</dt>
            <dd>${product.markup_price}</dd>
            {product.discount_percent != null && (
              <>
                <dt className="text-muted-foreground">Discount</dt>
                <dd>{product.discount_percent}%</dd>
              </>
            )}
            {product.sale_price != null && (
              <>
                <dt className="text-muted-foreground">Sale price</dt>
                <dd className="font-medium">${product.sale_price}</dd>
              </>
            )}
          </dl>
        </CardContent>
      </Card>

      <RelatedProducts products={relatedProducts} />
    </motion.div>
  );
}
