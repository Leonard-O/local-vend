import { useState, useMemo } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import EnhancedRatingDialog from '@/components/EnhancedRatingDialog';
import DeliveryCodeVerification from '@/components/DeliveryCodeVerification';
import RiderLeaderboard from '@/components/RiderLeaderboard';
import PaymentStatusCard from '@/components/PaymentStatusCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, MapPin, Phone, Clock, CheckCircle, XCircle, Package, Map, Star } from 'lucide-react';
import { DeliveryStatus } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';
import { supabase } from '@/lib/supabaseClient';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RiderDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { orders, updateOrder, ratings, addRating, payments, getRiderPerformance, updatePayment, riders, updateRider } = useData();
  const [activeTab, setActiveTab] = useState('list');
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean;
    order: any;
    type: 'pickup' | 'delivery';
  }>({
    open: false,
    order: null,
    type: 'pickup'
  });
  const [ratingDialog, setRatingDialog] = useState<{
    open: boolean;
    toUserId: string;
    toUserName: string;
    roleType: 'vendor' | 'rider' | 'customer';
    orderId?: string;
  }>({
    open: false,
    toUserId: '',
    toUserName: '',
    roleType: 'customer'
  });

  // Get rider orders instead of deliveries
  const riderOrders = useMemo(() => {
    const filtered = orders.filter(o => o.rider_id === user?.id);
    console.log('Rider Dashboard - Orders:', {
      totalOrders: orders.length,
      riderId: user?.id,
      riderOrders: filtered.length,
      allOrders: orders.map(o => ({ id: o.id.slice(-6), rider_id: o.rider_id, status: o.status }))
    });
    return filtered;
  }, [orders, user?.id]);

  const hasRated = (orderId: string, toUserId: string) => {
    return ratings.some(r => 
      r.from_user_id === user?.id && 
      r.to_user_id === toUserId && 
      r.order_id === orderId
    );
  };

  const riderPerformance = useMemo(() => getRiderPerformance(), [getRiderPerformance]);
  const myPerformance = riderPerformance.find(p => p.riderId === user?.id);

  const handleVerification = (orderId: string, type: 'pickup' | 'delivery', success: boolean) => {
    if (success) {
      const order = riderOrders.find(o => o.id === orderId);
      if (order) {
        const updates: any = {
          ...order,
          updated_at: new Date().toISOString()
        };

        if (type === 'pickup') {
          updates.pickup_confirmed = true;
          updates.pickup_time = new Date().toISOString();
          updates.status = 'in_transit';
          toast({
            title: '✅ Pickup Confirmed',
            description: 'Package picked up successfully. Customer notified.',
          });
        } else {
          updates.delivery_confirmed = true;
          updates.delivery_time = new Date().toISOString();
          updates.status = 'delivered';
          
          // Release payment
          const orderPayment = payments.find(p => p.order_id === orderId);
          if (orderPayment) {
            updatePayment({
              ...orderPayment,
              status: 'completed',
              rider_id: user?.id || null
            });
          }
          
          // Update rider status back to available
          if (user?.id) {
            const currentRider = riders.find(r => r.id === user.id);
            if (currentRider) {
              const updatedRider = {
                ...currentRider,
                status: 'available',
                active_deliveries: Math.max(0, (currentRider.active_deliveries || 1) - 1),
                total_deliveries: (currentRider.total_deliveries || 0) + 1
              };
              
              console.log('Updating rider status:', {
                riderId: user.id,
                oldStatus: currentRider.status,
                newStatus: 'available',
                activeDeliveries: updatedRider.active_deliveries
              });
              
              updateRider(updatedRider);
            }
          }
          
          // Send notification to vendor
          const sendVendorNotification = async () => {
            try {
              const { error } = await supabase.from('notifications').insert([
                {
                  vendor_id: order.vendor_id,
                  message: `🟢 Delivery completed for Order #${order.id.slice(-6)}. Rider ${user?.name} is now available for new assignments.`,
                  type: 'success',
                }
              ]);
              
              if (error) {
                console.error('Error sending notification:', error);
              }
            } catch (error) {
              console.error('Error sending notification:', error);
            }
          };
          
          sendVendorNotification();
          
          toast({
            title: '✅ Delivery Confirmed!',
            description: 'You are now available for new orders.',
            duration: 5000,
          });
        }

        updateOrder(updates);
      }
    }
  };

  const handleRatingSubmit = (rating: number, feedback: string) => {
    addRating({
      id: `rating_${Date.now()}`,
      from_user_id: user?.id || '',
      from_user_name: user?.name || '',
      to_user_id: ratingDialog.toUserId,
      to_user_name: ratingDialog.toUserName,
      role_type: ratingDialog.roleType,
      rating,
      feedback,
      order_id: ratingDialog.orderId,
      created_at: new Date().toISOString(),
      canEdit: true
    });

    toast({
      title: 'Rating Submitted',
      description: `You rated ${ratingDialog.toUserName} ${rating} stars`,
    });
  };

  const handleStatusUpdate = (orderId: string, newStatus: DeliveryStatus) => {
    const order = riderOrders.find(o => o.id === orderId);
    if (order) {
      updateOrder({
        ...order,
        status: newStatus,
        updated_at: new Date().toISOString()
      });

      const statusMessages = {
        in_transit: 'Customer notified: Order is on the way',
        delivered: 'Customer notified: Order delivered successfully',
        failed: 'Customer notified: Delivery failed',
      };

      if (newStatus in statusMessages) {
        toast({
          title: 'Status Updated',
          description: statusMessages[newStatus as keyof typeof statusMessages],
        });
      }

      // Prompt for rating when delivery is completed
      if (newStatus === 'delivered') {
        setTimeout(() => {
          toast({
            title: 'Rate this delivery',
            description: 'Would you like to rate the customer and vendor?',
            action: (
              <Button
                size="sm"
                onClick={() => {
                  setRatingDialog({
                    open: true,
                    toUserId: order.vendor_id,
                    toUserName: order.vendor_name,
                    roleType: 'vendor',
                    orderId: order.id
                  });
                }}
              >
                Rate Now
              </Button>
            ),
          });
        }, 1000);
      }
    }
  };

  const getStatusConfig = (status: DeliveryStatus) => {
    const configs = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      assigned: { label: 'Assigned', variant: 'default' as const, icon: Package },
      in_transit: { label: 'In Transit', variant: 'default' as const, icon: Truck },
      delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle },
    };
    return configs[status];
  };

  const activeOrders = riderOrders.filter(o => o.status === 'assigned' || o.status === 'in_transit');
  const completedOrders = riderOrders.filter(o => o.status === 'delivered' || o.status === 'failed');

  // Calculate map center based on active orders
  const mapCenter: [number, number] = useMemo(() => {
    if (activeOrders.length > 0 && activeOrders[0].customer_location_lat && activeOrders[0].customer_location_lng) {
      return [activeOrders[0].customer_location_lat, activeOrders[0].customer_location_lng];
    }
    return [40.7128, -74.0060]; // Default to NYC
  }, [activeOrders]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">My Deliveries</h2>
          <p className="text-muted-foreground">
            Manage and update your assigned deliveries
          </p>
        </div>

        {/* Stats with Performance */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{activeOrders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {completedOrders.filter(o => o.status === 'delivered').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                My Rank
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">#{myPerformance?.rank || '-'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{myPerformance?.performanceScore.toFixed(0) || '-'}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="list" className="gap-2">
              <Package className="w-4 h-4" />
              Deliveries
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2">
              <Star className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-2">
              <Map className="w-4 h-4" />
              Map
            </TabsTrigger>
          </TabsList>

          {/* List View */}
          <TabsContent value="list" className="space-y-8">
            {/* Active Orders */}
            {activeOrders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>
                <div className="space-y-4">
                  {activeOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;
                    const orderPayment = payments.find(p => p.order_id === order.id);

                    return (
                      <Card key={order.id} className="border-2 border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">Order #{order.id.slice(-6)}</CardTitle>
                                <Badge variant={statusConfig.variant} className="gap-1">
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <CardDescription>
                                {format(new Date(order.created_at), 'MMM dd, yyyy • hh:mm a')}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">KES {order.total_amount.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium mb-1">Deliver To: {order.customer_name}</p>
                                <p className="text-sm text-muted-foreground">Customer Location</p>
                              </div>
                            </div>
                            
                            {/* Customer Location Map */}
                            {order.customer_location_lat && order.customer_location_lng && (
                              <div className="rounded-lg overflow-hidden border">
                                <iframe
                                  width="100%"
                                  height="200"
                                  style={{ border: 0 }}
                                  loading="lazy"
                                  allowFullScreen
                                  src={`https://www.google.com/maps?q=${order.customer_location_lat},${order.customer_location_lng}&z=15&output=embed`}
                                ></iframe>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Items:</p>
                            <div className="space-y-2">
                              {order.products.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  {item.quantity}x {item.product_name}
                                  {item.unit_label && (
                                    <span className="text-muted-foreground ml-1">
                                      ({formatUnitLabel(item.unit_type, item.unit_value, item.unit_label)})
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {order.notes && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-xs font-medium text-yellow-900 dark:text-yellow-200 mb-1">Special Instructions:</p>
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">{order.notes}</p>
                            </div>
                          )}

                          {/* Add verification buttons */}
                          {order.status === 'assigned' && !order.pickup_confirmed && (
                            <Button
                              onClick={() => setVerificationDialog({
                                open: true,
                                order: order,
                                type: 'pickup'
                              })}
                              className="w-full"
                            >
                              <Package className="w-4 h-4 mr-2" />
                              Confirm Pickup from Vendor
                            </Button>
                          )}

                          {order.pickup_confirmed && order.status === 'in_transit' && !order.delivery_confirmed && (
                            <Button
                              onClick={() => setVerificationDialog({
                                open: true,
                                order: order,
                                type: 'delivery'
                              })}
                              className="w-full"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Confirm Delivery to Customer
                            </Button>
                          )}
                          
                          {!order.pickup_confirmed && order.status !== 'assigned' && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                ⚠️ You must confirm pickup before proceeding to delivery
                              </p>
                            </div>
                          )}

                          {/* Show payment status */}
                          {orderPayment && (
                            <PaymentStatusCard payment={orderPayment} />
                          )}

                          <div className="pt-3 border-t">
                            <Label className="text-sm font-medium mb-2 block">Update Status</Label>
                            <Select
                              value={order.status}
                              onValueChange={(value) => handleStatusUpdate(order.id, value as DeliveryStatus)}
                            >
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="assigned">Assigned</SelectItem>
                                <SelectItem value="in_transit">In Transit</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {order.status === 'delivered' && (
                            <div className="pt-3 border-t space-y-2">
                              <Label className="text-sm font-medium">Rate this delivery</Label>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setRatingDialog({
                                    open: true,
                                    toUserId: order.vendor_id,
                                    toUserName: order.vendor_name,
                                    roleType: 'vendor',
                                    orderId: order.id
                                  })}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Rate Vendor
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setRatingDialog({
                                    open: true,
                                    toUserId: order.customer_id,
                                    toUserName: order.customer_name,
                                    roleType: 'customer',
                                    orderId: order.id
                                  })}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Rate Customer
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed Orders */}
            {completedOrders.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Completed Deliveries</h3>
                <div className="space-y-3">
                  {completedOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;
                    const hasRatedCustomer = hasRated(order.id, order.customer_id);
                    const hasRatedVendor = hasRated(order.id, order.vendor_id);

                    return (
                      <Card key={order.id} className="opacity-75">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <p className="font-semibold">Order #{order.id.slice(-6)}</p>
                                <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                              </div>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="font-bold">KES {order.total_amount.toFixed(2)}</p>
                          </div>
                        </CardHeader>
                        {order.status === 'delivered' && (
                          <CardContent className="pt-0">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={hasRatedCustomer ? "secondary" : "outline"}
                                className="flex-1 gap-2"
                                disabled={hasRatedCustomer}
                                onClick={() => setRatingDialog({
                                  open: true,
                                  toUserId: order.customer_id,
                                  toUserName: order.customer_name,
                                  roleType: 'customer',
                                  orderId: order.id
                                })}
                              >
                                <Star className={`w-4 h-4 ${hasRatedCustomer ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                {hasRatedCustomer ? 'Customer Rated' : 'Rate Customer'}
                              </Button>
                              <Button
                                size="sm"
                                variant={hasRatedVendor ? "secondary" : "outline"}
                                className="flex-1 gap-2"
                                disabled={hasRatedVendor}
                                onClick={() => setRatingDialog({
                                  open: true,
                                  toUserId: order.vendor_id,
                                  toUserName: order.vendor_name,
                                  roleType: 'vendor',
                                  orderId: order.id
                                })}
                              >
                                <Star className={`w-4 h-4 ${hasRatedVendor ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                                {hasRatedVendor ? 'Vendor Rated' : 'Rate Vendor'}
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {riderOrders.length === 0 && (
              <Card className="p-12">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Truck className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No deliveries assigned</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    You don't have any deliveries assigned yet. Check back later for new orders.
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <RiderLeaderboard performances={riderPerformance} />
          </TabsContent>

          {/* Map View */}
          <TabsContent value="map">
            {activeOrders.length > 0 ? (
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Active Deliveries Map
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[600px] rounded-lg overflow-hidden border">
                      <MapContainer
                        center={mapCenter}
                        zoom={12}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        
                        {activeOrders.map((order) => (
                          <div key={order.id}>
                            {/* Customer Location */}
                            {order.customer_location_lat && order.customer_location_lng && (
                              <Marker position={[order.customer_location_lat, order.customer_location_lng]}>
                                <Popup>
                                  <div className="text-center">
                                    <p className="font-semibold">{order.customer_name}</p>
                                    <p className="text-sm text-muted-foreground">Order #{order.id.slice(-6)}</p>
                                    <p className="text-sm font-medium">KES {order.total_amount.toFixed(2)}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            )}

                            {/* Route Line */}
                            {order.rider_location_lat && order.rider_location_lng &&
                             order.customer_location_lat && order.customer_location_lng && (
                              <Polyline
                                positions={[
                                  [order.rider_location_lat, order.rider_location_lng],
                                  [order.customer_location_lat, order.customer_location_lng]
                                ]}
                                color="blue"
                                weight={3}
                                opacity={0.7}
                                dashArray="10, 10"
                              />
                            )}
                          </div>
                        ))}
                      </MapContainer>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Active Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                      {activeOrders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div key={order.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm">Order #{order.id.slice(-6)}</p>
                                <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                              </div>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">Customer Location</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold">KES {order.total_amount.toFixed(2)}</span>
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order.id, value as DeliveryStatus)}
                              >
                                <SelectTrigger className="h-8 w-32 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="assigned">Assigned</SelectItem>
                                  <SelectItem value="in_transit">In Transit</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Map className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No Active Deliveries</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    You don't have any active deliveries to track on the map
                  </p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <EnhancedRatingDialog
        open={ratingDialog.open}
        onOpenChange={(open) => setRatingDialog({ ...ratingDialog, open })}
        targetUserId={ratingDialog.toUserId}
        targetUserName={ratingDialog.toUserName}
        roleType={ratingDialog.roleType}
        orderId={ratingDialog.orderId || ''}
        onSubmit={handleRatingSubmit}
      />

      {verificationDialog.order && (
        <DeliveryCodeVerification
          open={verificationDialog.open}
          onOpenChange={(open) => setVerificationDialog({ ...verificationDialog, open })}
          order={verificationDialog.order}
          verificationType={verificationDialog.type}
          onVerify={(success) => handleVerification(verificationDialog.order.id, verificationDialog.type, success)}
        />
      )}
    </div>
  );
}