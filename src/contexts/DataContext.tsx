import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, Delivery, Rider, Vendor, Customer, Order, Rating, Payment, RiderPerformance, Notification } from '@/types';
import { mockProducts, mockDeliveries, mockRiders, mockVendors, mockCustomers, mockOrders, mockRatings, mockPayments, calculatePerformanceScore } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';

// Data Context for managing application state
interface DataContextType {
  products: Product[];
  deliveries: Delivery[];
  riders: Rider[];
  vendors: Vendor[];
  customers: Customer[];
  orders: Order[];
  ratings: Rating[];
  payments: Payment[];
  notifications: Notification[];
  addProduct: (product: Partial<Product>) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  deleteProduct: (productId: string) => void;
  addDelivery: (delivery: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>) => void;
  updateDelivery: (delivery: Delivery) => void;
  addOrder: (order: Order) => void;
  updateOrder: (order: Order) => void;
  addRider: (rider: Rider) => void;
  updateRider: (rider: Rider) => void;
  deleteRider: (riderId: string) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (vendorId: string) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  addRating: (rating: Rating) => void;
  updateRating: (rating: Rating) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (payment: Payment) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getRiderPerformance: () => RiderPerformance[];
  refreshData: () => void;
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data from Supabase
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        { data: productsData, error: productsError },
        { data: ordersData, error: ordersError },
        { data: ridersData, error: ridersError },
        { data: vendorsData, error: vendorsError },
        { data: customersData, error: customersError },
        { data: deliveriesData, error: deliveriesError },
        { data: ratingsData, error: ratingsError },
        { data: paymentsData, error: paymentsError },
        { data: notificationsData, error: notificationsError }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('riders').select('*'),
        supabase.from('vendors').select('*'),
        supabase.from('customers').select('*'),
        supabase.from('deliveries').select('*').order('created_at', { ascending: false }),
        supabase.from('ratings').select('*'),
        supabase.from('payments').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: false })
      ]);

      if (productsError) console.error('Products error:', productsError);
      if (ordersError) console.error('Orders error:', ordersError);
      if (ridersError) console.error('Riders error:', ridersError);
      if (vendorsError) console.error('Vendors error:', vendorsError);
      if (customersError) console.error('Customers error:', customersError);
      if (deliveriesError) console.error('Deliveries error:', deliveriesError);
      if (ratingsError) console.error('Ratings error:', ratingsError);
      if (paymentsError) console.error('Payments error:', paymentsError);
      if (notificationsError) console.error('Notifications error:', notificationsError);

      setProducts(productsData || []);
      setOrders(ordersData || []);
      setRiders(ridersData || []);
      setVendors(vendorsData || []);
      setCustomers(customersData || []);
      setDeliveries(deliveriesData || []);
      setRatings(ratingsData || []);
      setPayments(paymentsData || []);
      setNotifications(notificationsData || []);
      
      console.log('Data loaded:', {
        products: productsData?.length || 0,
        orders: ordersData?.length || 0,
        riders: ridersData?.length || 0,
        vendors: vendorsData?.length || 0,
        notifications: notificationsData?.length || 0
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading data',
        description: 'Failed to load data from server',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    loadData();
  };

  // Setup real-time subscriptions
  useEffect(() => {
    // Load initial data
    loadData();

    // Subscribe to realtime changes
    const productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setProducts(prev => {
            // Check if product already exists to prevent duplicates
            if (prev.some(p => p.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new as Product];
          });
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to orders for real-time updates
    const ordersChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders(prev => [newOrder, ...prev]);
          
          // Notify vendor of new order
          if (user?.role === 'vendor' && newOrder.vendor_id === user.id) {
            toast({
              title: '🛒 New Order Received!',
              description: `Order from ${newOrder.customer_name} — ${newOrder.products.map((p: any) => p.productName).join(', ')} — KES ${newOrder.total_amount.toFixed(2)}`,
              duration: 8000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
          
          // Notify customer of status change
          if (user?.role === 'customer' && updatedOrder.customer_id === user.id) {
            const statusMessages: Record<string, string> = {
              assigned: '👨‍🍳 Your order is being prepared',
              in_transit: '🚴 Your rider is on the way!',
              delivered: '✅ Your order has been delivered',
              failed: '❌ Delivery failed - please contact support'
            };
            
            const message = statusMessages[updatedOrder.status];
            if (message) {
              toast({
                title: 'Order Status Update',
                description: message,
                duration: 6000,
              });
            }
          }
          
          // Notify rider of assignment
          if (user?.role === 'rider' && updatedOrder.rider_id === user.id && updatedOrder.status === 'assigned') {
            toast({
              title: '📦 New Delivery Assigned',
              description: `Pickup from ${updatedOrder.vendor_name} — Deliver to ${updatedOrder.customer_name}`,
              duration: 8000,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to riders for real-time status updates
    const ridersChannel = supabase
      .channel('riders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'riders' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRiders(prev => {
            if (prev.some(r => r.id === payload.new.id)) {
              return prev;
            }
            return [...prev, payload.new as Rider];
          });
        } else if (payload.eventType === 'UPDATE') {
          setRiders(prev => prev.map(r => r.id === payload.new.id ? payload.new as Rider : r));
        } else if (payload.eventType === 'DELETE') {
          setRiders(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    // Subscribe to notifications for real-time vendor notifications
    const notificationsChannel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast notification to vendor
        if (user?.role === 'vendor' && newNotification.vendor_id === user.id) {
          toast({
            title: 'Delivery Completed',
            description: newNotification.message,
            duration: 8000,
          });
        }
      })
      .subscribe();

    return () => {
      if (ordersChannel) {
        supabase.removeChannel(ordersChannel);
      }
      if (productsChannel) {
        supabase.removeChannel(productsChannel);
      }
      if (ridersChannel) {
        supabase.removeChannel(ridersChannel);
      }
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel);
      }
    };
  }, [user, toast]);

  const addProduct = async (product: Partial<Product>) => {
    try {
      // Ensure vendor_id is included
      if (!product.vendor_id) {
        throw new Error('Vendor ID is required to add a product');
      }

      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      setProducts(prev => [...prev, data]);
      
      toast({
        title: 'Product Added',
        description: 'Your product has been added successfully',
      });
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add product',
        variant: 'destructive'
      });
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, ...updates } : p
      ));
      
      toast({
        title: 'Product Updated',
        description: 'Your product has been updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive'
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive'
      });
    }
  };

  const addDelivery = async (delivery: Omit<Delivery, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Ensure products include unit information
      const productsWithUnits = delivery.products.map(item => {
        const product = products.find(p => p.id === item.productId);
        return {
          ...item,
          unit_type: product?.unit_type || null,
          unit_value: product?.unit_value || null,
          unit_label: product?.unit_label || null,
        };
      });

      const { data, error } = await supabase
        .from('deliveries')
        .insert([{
          ...delivery,
          products: productsWithUnits,
        }])
        .select()
        .single();

      if (error) throw error;
      
      setDeliveries(prev => [...prev, data]);
      
      // Update product stock
      for (const item of delivery.products) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await updateProduct(item.productId, {
            stock_quantity: product.stock_quantity - item.quantity
          });
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error adding delivery:', error);
      throw error;
    }
  };

  const updateDelivery = async (delivery: Delivery) => {
    try {
      const { error } = await supabase
        .from('deliveries')
        .update(delivery)
        .eq('id', delivery.id);
      
      if (error) throw error;
      setDeliveries(prev => prev.map(d => d.id === delivery.id ? delivery : d));
    } catch (error) {
      console.error('Error updating delivery:', error);
      toast({
        title: 'Error',
        description: 'Failed to update delivery',
        variant: 'destructive'
      });
    }
  };

  const addOrder = async (order: Order) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();
      
      if (error) throw error;
      setOrders(prev => [data, ...prev]);
      
      toast({
        title: 'Order Placed Successfully!',
        description: `Your order has been placed. Total: KES ${order.total_amount.toFixed(2)}`,
      });
    } catch (error) {
      console.error('Error adding order:', error);
      toast({
        title: 'Error',
        description: 'Failed to place order',
        variant: 'destructive'
      });
    }
  };

  const updateOrder = async (order: Order) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ ...order, updated_at: new Date().toISOString() })
        .eq('id', order.id);
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === order.id ? order : o));
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order',
        variant: 'destructive'
      });
    }
  };

  const addRider = async (rider: Rider) => {
    try {
      const { data, error } = await supabase
        .from('riders')
        .insert([rider])
        .select()
        .single();
      
      if (error) throw error;
      setRiders(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding rider:', error);
      toast({
        title: 'Error',
        description: 'Failed to add rider',
        variant: 'destructive'
      });
    }
  };

  const updateRider = async (rider: Rider) => {
    try {
      console.log('DataContext: Updating rider in Supabase:', {
        riderId: rider.id,
        riderName: rider.name,
        oldStatus: riders.find(r => r.id === rider.id)?.status,
        newStatus: rider.status,
        activeDeliveries: rider.active_deliveries,
        totalDeliveries: rider.total_deliveries
      });

      const { data, error } = await supabase
        .from('riders')
        .update({
          status: rider.status,
          active_deliveries: rider.active_deliveries,
          total_deliveries: rider.total_deliveries,
          updated_at: new Date().toISOString()
        })
        .eq('id', rider.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('DataContext: Rider updated successfully in Supabase:', data);
      setRiders(prev => prev.map(r => r.id === rider.id ? rider : r));
      
      toast({
        title: '✅ Rider Status Updated',
        description: `Rider ${rider.name} is now ${rider.status}`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating rider:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rider status',
        variant: 'destructive'
      });
    }
  };

  const deleteRider = async (riderId: string) => {
    try {
      const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', riderId);
      
      if (error) throw error;
      setRiders(prev => prev.filter(r => r.id !== riderId));
    } catch (error) {
      console.error('Error deleting rider:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete rider',
        variant: 'destructive'
      });
    }
  };

  const addVendor = async (vendor: Vendor) => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .insert([vendor])
        .select()
        .single();
      
      if (error) throw error;
      setVendors(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to add vendor',
        variant: 'destructive'
      });
    }
  };

  const updateVendor = async (vendor: Vendor) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .update(vendor)
        .eq('id', vendor.id);
      
      if (error) throw error;
      setVendors(prev => prev.map(v => v.id === vendor.id ? vendor : v));
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to update vendor',
        variant: 'destructive'
      });
    }
  };

  const deleteVendor = async (vendorId: string) => {
    try {
      const { error } = await supabase
        .from('vendors')
        .delete()
        .eq('id', vendorId);
      
      if (error) throw error;
      setVendors(prev => prev.filter(v => v.id !== vendorId));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete vendor',
        variant: 'destructive'
      });
    }
  };

  const addCustomer = async (customer: Customer) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();
      
      if (error) throw error;
      setCustomers(prev => [...prev, data]);
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to add customer',
        variant: 'destructive'
      });
    }
  };

  const updateCustomer = async (customer: Customer) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', customer.id);
      
      if (error) throw error;
      setCustomers(prev => prev.map(c => c.id === customer.id ? customer : c));
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Error',
        description: 'Failed to update customer',
        variant: 'destructive'
      });
    }
  };

  const addRating = async (rating: Rating) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([rating])
        .select()
        .single();
      
      if (error) throw error;
      setRatings(prev => [data, ...prev]);
      
      // Update average ratings
      const targetRatings = ratings.filter(r => r.to_user_id === rating.to_user_id);
      const avgRating = (targetRatings.reduce((sum, r) => sum + r.rating, rating.rating)) / (targetRatings.length + 1);
      
      if (rating.role_type === 'vendor') {
        const vendor = vendors.find(v => v.id === rating.to_user_id);
        if (vendor) await updateVendor({ ...vendor, rating: avgRating });
      } else if (rating.role_type === 'rider') {
        const rider = riders.find(r => r.id === rating.to_user_id);
        if (rider) await updateRider({ ...rider, rating: avgRating });
      } else if (rating.role_type === 'customer') {
        const customer = customers.find(c => c.id === rating.to_user_id);
        if (customer) await updateCustomer({ ...customer, rating: avgRating });
      }
    } catch (error) {
      console.error('Error adding rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to add rating',
        variant: 'destructive'
      });
    }
  };

  const updateRating = async (rating: Rating) => {
    try {
      const { error } = await supabase
        .from('ratings')
        .update(rating)
        .eq('id', rating.id);
      
      if (error) throw error;
      setRatings(prev => prev.map(r => r.id === rating.id ? rating : r));
    } catch (error) {
      console.error('Error updating rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to update rating',
        variant: 'destructive'
      });
    }
  };

  const addPayment = async (payment: Payment) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert([payment])
        .select()
        .single();
      
      if (error) throw error;
      setPayments(prev => [data, ...prev]);
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to add payment',
        variant: 'destructive'
      });
    }
  };

  const updatePayment = async (payment: Payment) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update(payment)
        .eq('id', payment.id);
      
      if (error) throw error;
      setPayments(prev => prev.map(p => p.id === payment.id ? payment : p));
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment',
        variant: 'destructive'
      });
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getRiderPerformance = (): RiderPerformance[] => {
    return riders.map(rider => {
      const riderRatings = ratings.filter(r => r.to_user_id === rider.id && r.role_type === 'rider');
      const averageRating = riderRatings.length > 0 
        ? riderRatings.reduce((sum, r) => sum + r.rating, 0) / riderRatings.length 
        : rider.rating || 0;
      
      const totalDeliveries = rider.total_deliveries || 0;
      const averageDeliveryTime = rider.average_delivery_time || 0;
      
      const performanceScore = calculatePerformanceScore(
        averageRating,
        totalDeliveries,
        averageDeliveryTime
      );

      return {
        riderId: rider.id,
        riderName: rider.name,
        averageRating,
        totalDeliveries,
        averageDeliveryTime,
        performanceScore
      };
    }).sort((a, b) => b.performanceScore - a.performanceScore)
      .map((perf, index) => ({ ...perf, rank: index + 1 }));
  };

  return (
    <DataContext.Provider
      value={{
        products,
        deliveries,
        riders,
        vendors,
        customers,
        orders,
        ratings,
        payments,
        notifications,
        addProduct,
        updateProduct,
        deleteProduct,
        addDelivery,
        updateDelivery,
        addOrder,
        updateOrder,
        addRider,
        updateRider,
        deleteRider,
        addVendor,
        updateVendor,
        deleteVendor,
        addCustomer,
        updateCustomer,
        addRating,
        updateRating,
        addPayment,
        updatePayment,
        markNotificationAsRead,
        getRiderPerformance,
        refreshData,
        loading,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};