export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  vendorId: string;
  imageUrl?: string;
}

export interface Rider {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  activeDeliveries: number;
  locationLat?: number;
  locationLng?: number;
  rating?: number;
  totalDeliveries?: number;
  averageDeliveryTime?: number; // in minutes
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  address: string;
  locationLat?: number;
  locationLng?: number;
  rating?: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  locationLat?: number;
  locationLng?: number;
  rating?: number;
}

export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'failed';

export type PaymentStatus = 'pending' | 'held' | 'released' | 'failed';

export interface Payment {
  id: string;
  orderId: string;
  customerId: string;
  vendorId: string;
  riderId?: string;
  totalAmount: number;
  vendorShare: number;
  riderShare: number;
  platformFee: number;
  status: PaymentStatus;
  mpesaTransactionId?: string;
  createdAt: string;
  releasedAt?: string;
}

export interface Delivery {
  id: string;
  vendorId: string;
  vendorName: string;
  customerId?: string;
  riderId?: string;
  riderName?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerLocationLat?: number;
  customerLocationLng?: number;
  vendorLocationLat?: number;
  vendorLocationLng?: number;
  riderLocationLat?: number;
  riderLocationLng?: number;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: DeliveryStatus;
  deliveryCode?: string;
  pickupConfirmed?: boolean;
  deliveryConfirmed?: boolean;
  pickupTime?: string;
  deliveryTime?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  vendorId: string;
  vendorName: string;
  riderId?: string;
  riderName?: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  status: DeliveryStatus;
  deliveryCode: string;
  pickupConfirmed?: boolean;
  deliveryConfirmed?: boolean;
  pickupTime?: string;
  deliveryTime?: string;
  distanceKm?: number;
  etaMinutes?: number;
  customerLocationLat?: number;
  customerLocationLng?: number;
  vendorLocationLat?: number;
  vendorLocationLng?: number;
  riderLocationLat?: number;
  riderLocationLng?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface Rating {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  roleType: 'vendor' | 'rider' | 'customer';
  rating: number;
  feedback?: string;
  orderId?: string;
  createdAt: string;
  updatedAt?: string;
  canEdit?: boolean;
}

export interface RiderPerformance {
  riderId: string;
  riderName: string;
  averageRating: number;
  totalDeliveries: number;
  averageDeliveryTime: number; // in minutes
  performanceScore: number;
  rank?: number;
}

export interface VendorWithDistance extends Vendor {
  distance?: number;
  products: Product[];
}