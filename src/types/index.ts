export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  created_at?: string;
}

export interface ProductSize {
  id: string;
  product_id: string;
  size_label: string;
  stock_quantity: number;
  is_available: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category_id: string | null;
  category_name?: string;
  category_slug?: string;
  description: string;
  regular_price: number;
  discounted_price: number | null;
  discount_percentage: number;
  image_url: string;
  gallery_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  is_special_offer: boolean;
  offer_label: string;
  created_at: string;
  updated_at?: string;
  sizes: ProductSize[];
}

export interface CartItem {
  product_id: string;
  slug: string;
  name: string;
  brand: string;
  image_url: string;
  size_label: string;
  quantity: number;
  regular_price: number;
  unit_price: number;
  discount_percentage: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  brand: string;
  size_label: string;
  quantity: number;
  unit_price: number;
  original_price: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  city_locality: string;
  pin_code: string;
  order_notes: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  status: OrderStatus;
  whatsapp_initiated: boolean;
  whatsapp_message: string;
  created_at: string;
  updated_at?: string;
  items?: OrderItem[];
}

export interface StoreSettings {
  id: number;
  store_name: string;
  store_logo_url: string;
  hero_image_url: string;
  whatsapp_country_code: string;
  whatsapp_number: string;
  contact_phone: string;
  store_email: string;
  store_address: string;
  delivery_charge: number;
  free_delivery_threshold: number;
  promo_banner_text: string;
  promo_banner_active: boolean;
  instagram_url: string;
  facebook_url: string;
  youtube_url: string;
}

export interface AdminProfile {
  user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
}

export interface CheckoutFormData {
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  city_locality: string;
  pin_code: string;
  order_notes: string;
}

export interface OrderPlacementResult {
  order_id: string;
  order_number: string;
  subtotal: number;
  delivery_charge: number;
  total_amount: number;
  whatsapp_url: string;
  whatsapp_message: string;
}
