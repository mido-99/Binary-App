import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";

export function StoresListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: async () => {
      const { data } = await api.get<{ stores: { id: number; name: string }[] }>("/api/stores/");
      return data;
    },
  });

  const stores = data?.stores ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h1 className="font-heading text-3xl font-bold tracking-tight">Stores</h1>
      <p className="text-muted-foreground">Browse all stores and their products.</p>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <p className="text-muted-foreground py-12">No stores yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store, i) => (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/store/${store.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Store className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-heading text-lg font-semibold">{store.name}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
