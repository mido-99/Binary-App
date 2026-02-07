export type OrderStatus = "pending" | "paid" | "cancelled";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_purchase: string;
  product_image?: string;
}

export interface Order {
  id: number;
  order_number?: string;
  buyer_id: number;
  total_price: string;
  status: OrderStatus;
  created_at: string;
  items?: OrderItem[];
  shipping_address?: ShippingAddress;
  payment_method?: string;
}

export interface ShippingAddress {
  id?: number;
  full_name: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  phone: string;
  is_default?: boolean;
}
