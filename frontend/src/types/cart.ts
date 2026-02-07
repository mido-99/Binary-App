import type { Product } from "./product";

export interface CartItem {
  id: string;
  product_id: number;
  product: Pick<Product, "id" | "name" | "markup_price" | "sale_price" | "store_name">;
  quantity: number;
  price: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: string;
  total?: string;
  item_count: number;
}
