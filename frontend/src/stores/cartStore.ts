import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartState {
  items: CartItem[];
  addItem: (productId: number, product: CartItem["product"], quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => string;
  getItemCount: () => number;
}

function generateCartItemId(productId: number): string {
  return `cart-${productId}-${Date.now()}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem(productId, product, quantity = 1) {
        set((state) => {
          const existing = state.items.find((i) => i.product_id === productId);
          const price = product.sale_price ?? product.markup_price;
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === productId
                  ? {
                      ...i,
                      quantity: i.quantity + quantity,
                    }
                  : i
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                id: generateCartItemId(productId),
                product_id: productId,
                product,
                quantity,
                price,
              },
            ],
          };
        });
      },

      removeItem(productId) {
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        }));
      },

      updateQuantity(productId, quantity) {
        if (quantity < 1) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      getTotal() {
        const { items } = get();
        const total = items.reduce(
          (sum, i) => sum + parseFloat(i.price) * i.quantity,
          0
        );
        return total.toFixed(2);
      },

      getItemCount() {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    { name: "cart-storage" }
  )
);
