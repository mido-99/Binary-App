import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Store } from "lucide-react";

interface SellerDetail {
  id: number;
  email: string;
  created_at: string;
  store_count: number;
  product_count: number;
}

interface StoreItem {
  id: number;
  name: string;
  description: string;
  product_count: number;
}

export function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const sellerId = id ? parseInt(id, 10) : NaN;

  const { data: seller, isLoading, error } = useQuery<SellerDetail>({
    queryKey: ["seller", sellerId],
    queryFn: async () => {
      const { data } = await api.get(`/api/sellers/${sellerId}/`);
      return data;
    },
    enabled: Number.isInteger(sellerId),
  });

  const { data: storesData } = useQuery<{ stores: StoreItem[] }>({
    queryKey: ["seller-stores", sellerId],
    queryFn: async () => {
      const { data } = await api.get(`/api/sellers/${sellerId}/stores/`);
      return data;
    },
    enabled: Number.isInteger(sellerId) && !!seller,
  });

  if (!Number.isInteger(sellerId)) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Invalid seller.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/sellers">All sellers</Link></Button>
      </motion.div>
    );
  }

  if (isLoading || error || !seller) {
    if (isLoading) return <div className="animate-pulse h-64 rounded-lg bg-muted" />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Seller not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/sellers">All sellers</Link></Button>
      </motion.div>
    );
  }

  const stores = storesData?.stores ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
          <User className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{seller.email}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{seller.store_count} store(s) · {seller.product_count} products</p>
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold mb-4">Stores</h2>
        {stores.length === 0 ? (
          <p className="text-muted-foreground py-8">No stores.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stores.map((store) => (
              <Link key={store.id} to={`/store/${store.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Store className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{store.name}</p>
                      <p className="text-sm text-muted-foreground">{store.product_count} products</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
