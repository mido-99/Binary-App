import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export function SellersListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sellers"],
    queryFn: async () => {
      const { data } = await api.get<{ sellers: { id: number; email: string }[] }>("/api/sellers/");
      return data;
    },
  });

  const sellers = data?.sellers ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h1 className="font-heading text-3xl font-bold tracking-tight">Sellers</h1>
      <p className="text-muted-foreground">Browse all sellers and their stores.</p>
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <p className="text-muted-foreground py-12">No sellers yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((seller, i) => (
            <motion.div
              key={seller.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/seller/${seller.id}`}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <User className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium truncate">{seller.email}</p>
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
