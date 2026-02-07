export interface Store {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  product_count?: number;
  seller?: { id: number; email: string };
}

export interface StoreDetail extends Store {
  products?: import("./product").Product[];
}
