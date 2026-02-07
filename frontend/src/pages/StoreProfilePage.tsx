import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Link } from "react-router-dom";
import { ProductGrid } from "@/components/store/ProductGrid";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import type { Product } from "@/types";

interface StoreDetail {
  id: number;
  name: string;
  description: string;
  created_at: string;
  product_count: number;
  seller: { id: number; email: string } | null;
}

export function StoreProfilePage() {
  const { id } = useParams<{ id: string }>();
  const storeId = id ? parseInt(id, 10) : NaN;

  const { data: store, isLoading, error } = useQuery<StoreDetail>({
    queryKey: ["store", storeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/stores/${storeId}/`);
      return data;
    },
    enabled: Number.isInteger(storeId),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery<{
    products: Product[];
    total_count: number;
    page: number;
    page_size: number;
  }>({
    queryKey: ["store-products", storeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/stores/${storeId}/products/`);
      return data;
    },
    enabled: Number.isInteger(storeId) && !!store,
  });

  if (!Number.isInteger(storeId)) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Invalid store.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/stores">All stores</Link></Button>
      </motion.div>
    );
  }

  if (isLoading || error || !store) {
    if (isLoading) return <div className="animate-pulse h-64 rounded-lg bg-muted" />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Store not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/stores">All stores</Link></Button>
      </motion.div>
    );
  }

  const products = productsData?.products ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
          <Store className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{store.name}</h1>
          {store.description && <p className="mt-2 text-muted-foreground max-w-2xl">{store.description}</p>}
          <p className="mt-2 text-sm text-muted-foreground">{store.product_count} products</p>
          {store.seller && (
            <Link to={`/seller/${store.seller.id}`} className="text-sm text-primary hover:underline mt-1 inline-block">
              Seller: {store.seller.email}
            </Link>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold mb-4">Products</h2>
        {productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg bg-muted animate-pulse aspect-square" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground py-8">No products in this store.</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </motion.div>
  );
}
