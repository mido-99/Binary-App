import type { Store } from "./store";

export interface Seller {
  id: number;
  email: string;
  created_at?: string;
  store_count?: number;
  product_count?: number;
}

export interface SellerDetail extends Seller {
  stores: Store[];
}
