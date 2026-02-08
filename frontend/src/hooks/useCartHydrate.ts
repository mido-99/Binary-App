import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";

/**
 * When enabled (e.g. cart drawer open or on cart page), syncs Zustand cart to backend
 * and merges image_url + seller_name from API into each item so preview and seller show correctly.
 */
export function useCartHydrate(enabled: boolean) {
  const items = useCartStore((s) => s.items);
  const mergeProductFromApi = useCartStore((s) => s.mergeProductFromApi);

  const { data } = useQuery({
    queryKey: ["cart-hydrate", enabled, items.length, items.map((i) => `${i.product_id}:${i.quantity}`).join(",")],
    queryFn: async () => {
      await api.post("/api/cart/clear/");
      for (const item of items) {
        await api.post("/api/cart/add/", { product_id: item.product_id, quantity: item.quantity });
      }
      const { data: cartData } = await api.get<{ items: Array<{ product_id: number; product: { image_url?: string; seller_name?: string } }> }>("/api/cart/");
      return cartData;
    },
    enabled: enabled && items.length > 0,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!data?.items) return;
    for (const apiItem of data.items) {
      const patch: { image_url?: string; seller_name?: string } = {};
      if (apiItem.product?.image_url) patch.image_url = apiItem.product.image_url;
      if (apiItem.product?.seller_name) patch.seller_name = apiItem.product.seller_name;
      if (Object.keys(patch).length) mergeProductFromApi(apiItem.product_id, patch);
    }
  }, [data, mergeProductFromApi]);
}
