import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore } from "@/stores/cartStore";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

const shippingSchema = z.object({
  full_name: z.string().min(1, "Required"),
  address_line1: z.string().min(1, "Required"),
  address_line2: z.string().optional(),
  city: z.string().min(1, "Required"),
  state: z.string().min(1, "Required"),
  zip_code: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  phone: z.string().optional(),
});

type ShippingFormData = z.infer<typeof shippingSchema>;

const STEPS = ["shipping", "payment", "review"] as const;

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const items = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const clearCart = useCartStore((s) => s.clearCart);
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [savedAddressId, setSavedAddressId] = useState<number | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);

  const { data: addressesData } = useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data } = await api.get<{ addresses: Array<{
        id: number;
        full_name: string;
        address_line1: string;
        address_line2: string;
        city: string;
        state: string;
        zip_code: string;
        country: string;
        phone: string;
        is_default: boolean;
      }> }>("/api/users/me/addresses/");
      return data;
    },
    enabled: !!user,
  });

  const createOrder = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const cartItems = useCartStore.getState().items;
      await api.post("/api/cart/clear/");
      for (const item of cartItems) {
        await api.post("/api/cart/add/", { product_id: item.product_id, quantity: item.quantity });
      }
      const { data } = await api.post("/api/orders/", payload);
      return data as { order_id: number; order_number: string; total: string };
    },
    onSuccess: (data) => {
      clearCart();
      setOrderId(data.order_id);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order placed successfully");
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err.response?.data?.error || "Failed to place order");
    },
  });

  const form = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      full_name: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
      phone: "",
    },
  });

  if (authLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to={"/login?next=" + encodeURIComponent("/checkout")} replace />;
  }
  if (items.length === 0 && !orderId) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-2xl border border-dashed p-12 text-center"
      >
        <p className="text-muted-foreground">Your cart is empty.</p>
        <Button className="mt-4" onClick={() => navigate("/")}>Go to shop</Button>
      </motion.div>
    );
  }

  if (orderId) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto text-center space-y-6"
      >
        <h1 className="font-heading text-3xl font-bold">Thank you</h1>
        <p className="text-muted-foreground">Your order has been placed successfully.</p>
        <p className="font-medium">Order # {orderId}</p>
        <Button onClick={() => navigate("/orders")}>View orders</Button>
      </motion.div>
    );
  }

  const currentStep = STEPS[step];
  const total = getTotal();

  const getShippingPayload = () => {
    if (savedAddressId) {
      return { shipping_address_id: savedAddressId, payment_method: paymentMethod };
    }
    const values = form.getValues();
    return {
      full_name: values.full_name,
      address_line1: values.address_line1,
      address_line2: values.address_line2 || undefined,
      city: values.city,
      state: values.state,
      zip_code: values.zip_code,
      country: values.country,
      phone: values.phone || undefined,
      payment_method: paymentMethod,
    };
  };

  const handleSubmitOrder = () => {
    if (currentStep === "review") {
      createOrder.mutate(getShippingPayload());
      return;
    }
    if (currentStep === "shipping") {
      if (savedAddressId) {
        setStep(1);
        return;
      }
      form.handleSubmit(
        () => setStep(1),
        () => {}
      )();
      return;
    }
    if (currentStep === "payment") {
      setStep(2);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <h1 className="font-heading text-3xl font-bold">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {currentStep === "shipping" && (
              <motion.div
                key="shipping"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <h2 className="font-heading text-lg font-semibold">Shipping address</h2>
                {addressesData?.addresses?.length ? (
                  <div className="space-y-2">
                    {addressesData.addresses.map((addr) => (
                      <label key={addr.id} className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                        <input
                          type="radio"
                          name="address"
                          checked={savedAddressId === addr.id}
                          onChange={() => setSavedAddressId(addr.id)}
                          className="mt-1"
                        />
                        <div className="text-sm">
                          <p className="font-medium">{addr.full_name}</p>
                          <p>{addr.address_line1}</p>
                          {addr.address_line2 && <p>{addr.address_line2}</p>}
                          <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                          <p>{addr.country}</p>
                        </div>
                      </label>
                    ))}
                    <p className="text-sm text-muted-foreground">Or enter a new address below:</p>
                  </div>
                ) : null}
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full name</Label>
                      <Input id="full_name" {...form.register("full_name")} />
                      {form.formState.errors.full_name && (
                        <p className="text-sm text-destructive">{form.formState.errors.full_name.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line1">Address line 1</Label>
                    <Input id="address_line1" {...form.register("address_line1")} />
                    {form.formState.errors.address_line1 && (
                      <p className="text-sm text-destructive">{form.formState.errors.address_line1.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address_line2">Address line 2 (optional)</Label>
                    <Input id="address_line2" {...form.register("address_line2")} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" {...form.register("city")} />
                      {form.formState.errors.city && (
                        <p className="text-sm text-destructive">{form.formState.errors.city.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" {...form.register("state")} />
                      {form.formState.errors.state && (
                        <p className="text-sm text-destructive">{form.formState.errors.state.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zip_code">ZIP code</Label>
                      <Input id="zip_code" {...form.register("zip_code")} />
                      {form.formState.errors.zip_code && (
                        <p className="text-sm text-destructive">{form.formState.errors.zip_code.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" {...form.register("country")} />
                    {form.formState.errors.country && (
                      <p className="text-sm text-destructive">{form.formState.errors.country.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" {...form.register("phone")} />
                  </div>
                </form>
              </motion.div>
            )}
            {currentStep === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <h2 className="font-heading text-lg font-semibold">Payment method</h2>
                <div className="space-y-2">
                  {["card", "paypal", "bank"].map((method) => (
                    <label key={method} className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <input
                        type="radio"
                        name="payment"
                        value={method}
                        checked={paymentMethod === method}
                        onChange={() => setPaymentMethod(method)}
                      />
                      <span className="capitalize">{method}</span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}
            {currentStep === "review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <h2 className="font-heading text-lg font-semibold">Review order</h2>
                <p className="text-sm text-muted-foreground">Review your items and place order.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <Card className="sticky top-24">
            <CardContent className="p-4 space-y-4">
              <h2 className="font-heading font-semibold">Order summary</h2>
              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span className="truncate max-w-[180px]">{item.product.name} × {item.quantity}</span>
                    <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t pt-4 flex justify-between font-heading font-bold">
                <span>Total</span>
                <span>${total}</span>
              </div>
              <div className="flex gap-2">
                {step > 0 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1"
                  onClick={handleSubmitOrder}
                  disabled={createOrder.isPending}
                >
                  {createOrder.isPending ? "Placing order…" : currentStep === "review" ? "Place order" : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
