export type ProductCategory =
  | "electronics"
  | "fashion"
  | "home"
  | "sports"
  | "beauty"
  | "other";

export interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  category_display: string;
  base_price: string;
  markup_price: string;
  store_name: string;
  store_id?: number;
  discount_percent?: string;
  sale_price?: string;
  image_url?: string | null;
  is_active?: boolean;
}

export interface ProductDetail extends Product {
  full_description: string;
  store: { id: number; name: string };
  seller: { id: number; email: string } | null;
  images?: string[];
}

export interface ProductCategoryChoice {
  value: string;
  label: string;
}
