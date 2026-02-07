import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface OrderSummary {
  id: number;
  order_number: string;
  total_price: string;
  status: string;
  created_at: string;
  item_count: number;
}

export function OrdersPage() {
  const { data, isLoading } = useQuery<{
    orders: OrderSummary[];
    total_count: number;
    page: number;
    page_size: number;
  }>({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data } = await api.get("/api/orders/");
      return data;
    },
  });

  const orders = data?.orders ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <h1 className="font-heading text-3xl font-bold tracking-tight">Orders</h1>
      <p className="text-muted-foreground">Your order history.</p>
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">You have no orders yet.</p>
          <Button asChild className="mt-4">
            <Link to="/">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order, i) => (
            <motion.li
              key={order.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/orders/${order.id}`}>
                <Card className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-heading font-semibold">Order #{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()} · {order.item_count} item(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-heading font-bold">${order.total_price}</span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          order.status === "paid"
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : order.status === "cancelled"
                              ? "bg-muted text-muted-foreground"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
