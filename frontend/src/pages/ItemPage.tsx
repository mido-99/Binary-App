import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProductDetail = {
  id: number;
  name: string;
  description: string;
  full_description: string;
  category: string;
  category_display: string;
  base_price: string;
  markup_price: string;
  discount_percent?: string;
  sale_price?: string;
  store_name: string;
  store: { id: number; name: string };
  seller: { id: number; email: string } | null;
};

export function ItemPage() {
  const { id } = useParams<{ id: string }>();
  const productId = id ? parseInt(id, 10) : NaN;

  const { data: product, isLoading, error } = useQuery<ProductDetail>({
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
  const hasDiscount = product.sale_price != null || (product.discount_percent != null && Number(product.discount_percent) > 0);

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
        <div className="aspect-square rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground text-8xl font-heading font-bold">
          {product.name.charAt(0).toUpperCase()}
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              {product.category_display}
            </span>
            <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">{product.name}</h1>
            {product.store_name && (
              <p className="mt-1 text-sm text-muted-foreground">Sold by {product.store_name}</p>
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

          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-muted-foreground whitespace-pre-wrap">{product.full_description || product.description || "No description."}</p>
          </div>

          <Card>
            <CardContent className="p-4 space-y-2">
              <h2 className="font-heading text-sm font-semibold">Store & seller</h2>
              <dl className="text-sm space-y-1">
                <div>
                  <dt className="text-muted-foreground">Store</dt>
                  <dd className="font-medium">{product.store?.name ?? product.store_name}</dd>
                </div>
                {product.seller && (
                  <div>
                    <dt className="text-muted-foreground">Seller</dt>
                    <dd className="font-medium">{product.seller.email}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button size="lg" className="flex-1">
              Add to cart
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/">Continue shopping</Link>
            </Button>
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
    </motion.div>
  );
}
