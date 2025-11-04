import { Product, Delivery, Rider, Vendor, Customer, Order, Rating, Payment, RiderPerformance } from '@/types';

// Mock data for development
export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    vendorId: '1',
    name: 'Fresh Tomatoes',
    description: 'Locally grown organic tomatoes',
    price: 50,
    stock: 100,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1546470427-227e2e1e8c8e?w=400&q=80',
  },
  {
    id: 'prod_2',
    vendorId: '1',
    name: 'Sukuma Wiki',
    description: 'Fresh green vegetables',
    price: 20,
    stock: 150,
    category: 'Vegetables',
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
  },
  {
    id: 'prod_3',
    vendorId: '1',
    name: 'Fresh Milk',
    description: 'Farm fresh milk, 1 liter',
    price: 80,
    stock: 50,
    category: 'Dairy',
    imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&q=80',
  },
];

export const mockRiders: Rider[] = [
  {
    id: '2',
    name: 'Mike Rider',
    email: 'rider@demo.com',
    phone: '+1234567890',
    status: 'available',
    activeDeliveries: 0,
    locationLat: 40.7580,
    locationLng: -73.9855,
    rating: 4.8,
    totalDeliveries: 45,
    averageDeliveryTime: 25,
  },
];

export const mockVendors: Vendor[] = [
  {
    id: '1',
    name: 'John Vendor',
    email: 'vendor@demo.com',
    phone: '+1234567893',
    businessName: 'Fresh Local Market',
    address: '123 Market St, City',
    locationLat: 40.7128,
    locationLng: -74.0060,
    rating: 4.9,
  },
];

export const mockCustomers: Customer[] = [
  {
    id: '4',
    name: 'Jane Customer',
    email: 'customer@demo.com',
    phone: '+1234567894',
    address: '456 Oak Ave, City',
    locationLat: 40.7489,
    locationLng: -73.9680,
    rating: 5.0,
  },
];

export const mockPayments: Payment[] = [];

export const mockDeliveries: Delivery[] = [];

export const mockOrders: Order[] = [];

export const mockRatings: Rating[] = [];

// Utility function to calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Utility function to calculate ETA (assuming average speed of 30 km/h)
export const calculateETA = (distanceKm: number): number => {
  const averageSpeedKmh = 30;
  const timeHours = distanceKm / averageSpeedKmh;
  return Math.ceil(timeHours * 60); // Convert to minutes and round up
};

// Generate random delivery code
export const generateDeliveryCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Generate QR code data for delivery verification
export const generateQRCode = (deliveryCode: string, orderId: string): string => {
  return `LOCALVEND:${orderId}:${deliveryCode}`;
};

// Calculate rider performance score
export const calculatePerformanceScore = (
  averageRating: number,
  totalDeliveries: number,
  averageDeliveryTime: number
): number => {
  return (averageRating * 20) + (totalDeliveries * 2) - averageDeliveryTime;
};

// Calculate payment distribution
export const calculatePaymentDistribution = (totalAmount: number) => {
  const platformFeePercent = 0.05; // 5% platform fee
  const deliveryFee = 50; // Fixed delivery fee in KES
  
  const platformFee = totalAmount * platformFeePercent;
  const riderShare = deliveryFee;
  const vendorShare = totalAmount - platformFee - riderShare;
  
  return {
    vendorShare: Math.round(vendorShare * 100) / 100,
    riderShare: Math.round(riderShare * 100) / 100,
    platformFee: Math.round(platformFee * 100) / 100
  };
};