export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  stock_quantity: number;
  created_at?: string;
  updated_at?: string;
  // New unit fields (optional for backward compatibility)
  unit_type?: string | null;
  unit_value?: number | null;
  unit_label?: string | null;
  quantity_per_unit?: number | null;
}

export interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  active_deliveries: number;
  location_lat?: number;
  location_lng?: number;
  rating?: number;
  total_deliveries?: number;
  average_delivery_time?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  business_name: string;
  address: string;
  location_lat?: number;
  location_lng?: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  location_lat?: number;
  location_lng?: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';

export type PaymentStatus = 'pending' | 'held' | 'released' | 'failed';

export interface Payment {
  id: string;
  order_id: string;
  customer_id: string;
  vendor_id: string;
  rider_id?: string;
  total_amount: number;
  vendor_share: number;
  rider_share: number;
  platform_fee: number;
  status: PaymentStatus;
  mpesa_transaction_id?: string;
  created_at: string;
  released_at?: string;
}

export interface Delivery {
  id: string;
  vendor_id: string;
  vendor_name: string;
  customer_id?: string;
  rider_id?: string;
  rider_name?: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_location_lat?: number;
  customer_location_lng?: number;
  vendor_location_lat?: number;
  vendor_location_lng?: number;
  rider_location_lat?: number;
  rider_location_lng?: number;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit_type?: string | null;
    unit_value?: number | null;
    unit_label?: string | null;
  }>;
  total_amount: number;
  status: DeliveryStatus;
  delivery_code?: string;
  pickup_confirmed?: boolean;
  delivery_confirmed?: boolean;
  pickup_time?: string;
  delivery_time?: string;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  vendor_id: string;
  vendor_name: string;
  rider_id?: string;
  rider_name?: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    unit_type?: string | null;
    unit_value?: number | null;
    unit_label?: string | null;
  }>;
  total_amount: number;
  status: DeliveryStatus;
  delivery_code: string;
  pickup_confirmed?: boolean;
  delivery_confirmed?: boolean;
  pickup_time?: string;
  delivery_time?: string;
  distance_km?: number;
  eta_minutes?: number;
  customer_location_lat?: number;
  customer_location_lng?: number;
  vendor_location_lat?: number;
  vendor_location_lng?: number;
  rider_location_lat?: number;
  rider_location_lng?: number;
  created_at: string;
  updated_at: string;
  notes?: string;
}

export interface Rating {
  id: string;
  from_user_id: string;
  from_user_name: string;
  to_user_id: string;
  to_user_name: string;
  role_type: 'vendor' | 'rider' | 'customer';
  rating: number;
  feedback?: string;
  order_id?: string;
  created_at: string;
  updated_at?: string;
  canEdit?: boolean;
}

export interface RiderPerformance {
  riderId: string;
  riderName: string;
  averageRating: number;
  totalDeliveries: number;
  averageDeliveryTime: number;
  performanceScore: number;
  rank?: number;
}

export interface VendorWithDistance extends Vendor {
  distance?: number;
  products: Product[];
}