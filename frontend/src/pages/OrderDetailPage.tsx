import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

interface OrderDetail {
  id: number;
  order_number: string;
  total_price: string;
  status: string;
  created_at: string;
  shipping_full_name: string;
  shipping_address_line1: string;
  shipping_address_line2: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip_code: string;
  shipping_country: string;
  shipping_phone: string;
  payment_method: string;
  items: Array<{
    id: number;
    product_id: number;
    product_name: string;
    quantity: number;
    price_at_purchase: string;
  }>;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = id ? parseInt(id, 10) : NaN;
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery<OrderDetail>({
    queryKey: ["order", orderId],
    queryFn: async () => {
      const { data } = await api.get(`/api/orders/${orderId}/`);
      return data;
    },
    enabled: Number.isInteger(orderId),
  });

  const cancelOrder = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/orders/${orderId}/cancel/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || "Failed to cancel order");
    },
  });

  if (!Number.isInteger(orderId)) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Invalid order.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/orders">Back to orders</Link></Button>
      </motion.div>
    );
  }

  if (isLoading || error || !order) {
    if (isLoading) return <div className="animate-pulse h-64 rounded-lg bg-muted" />;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-dashed p-12 text-center">
        <p className="text-muted-foreground">Order not found.</p>
        <Button asChild variant="outline" className="mt-4"><Link to="/orders">Back to orders</Link></Button>
      </motion.div>
    );
  }

  const canCancel = order.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-3xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold">Order #{order.order_number}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(order.created_at).toLocaleString()} ·{" "}
            <span
              className={`font-medium ${
                order.status === "paid"
                  ? "text-green-600 dark:text-green-400"
                  : order.status === "cancelled"
                    ? "text-muted-foreground"
                    : "text-amber-600 dark:text-amber-400"
              }`}
            >
              {order.status}
            </span>
          </p>
        </div>
        {canCancel && (
          <Button
            variant="destructive"
            onClick={() => cancelOrder.mutate()}
            disabled={cancelOrder.isPending}
          >
            {cancelOrder.isPending ? "Cancelling…" : "Cancel order"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="font-heading font-semibold">Items</h2>
          <ul className="divide-y divide-border">
            {order.items.map((item) => (
              <li key={item.id} className="py-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                </div>
                <p className="font-heading font-bold">
                  ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
          <div className="border-t pt-4 flex justify-between font-heading font-bold text-lg">
            <span>Total</span>
            <span>${order.total_price}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-2">
          <h2 className="font-heading font-semibold">Shipping address</h2>
          <p>{order.shipping_full_name}</p>
          <p>{order.shipping_address_line1}</p>
          {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
          <p>
            {order.shipping_city}, {order.shipping_state} {order.shipping_zip_code}
          </p>
          <p>{order.shipping_country}</p>
          {order.shipping_phone && <p>{order.shipping_phone}</p>}
        </CardContent>
      </Card>

      {order.payment_method && (
        <Card>
          <CardContent className="p-4">
            <h2 className="font-heading font-semibold">Payment</h2>
            <p className="capitalize">{order.payment_method}</p>
          </CardContent>
        </Card>
      )}

      <Button variant="outline" asChild>
        <Link to="/orders">Back to orders</Link>
      </Button>
    </motion.div>
  );
}
