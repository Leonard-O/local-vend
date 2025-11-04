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
  const { deliveries, updateDelivery, ratings, addRating, payments, getRiderPerformance } = useData();
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

  const riderDeliveries = useMemo(() => 
    deliveries.filter(d => d.riderId === user?.id),
    [deliveries, user?.id]
  );

  const hasRated = (orderId: string, toUserId: string) => {
    return ratings.some(r => 
      r.fromUserId === user?.id && 
      r.toUserId === toUserId && 
      r.orderId === orderId
    );
  };

  const riderPerformance = useMemo(() => getRiderPerformance(), [getRiderPerformance]);
  const myPerformance = riderPerformance.find(p => p.riderId === user?.id);

  const handleVerification = (orderId: string, type: 'pickup' | 'delivery', success: boolean) => {
    if (success) {
      const delivery = riderDeliveries.find(d => d.id === orderId);
      if (delivery) {
        const updates: any = {
          ...delivery,
          updatedAt: new Date().toISOString()
        };

        if (type === 'pickup') {
          updates.pickupConfirmed = true;
          updates.pickupTime = new Date().toISOString();
          updates.status = 'in_transit';
          toast({
            title: 'Pickup Confirmed',
            description: 'Package picked up successfully. Customer notified.',
          });
        } else {
          updates.deliveryConfirmed = true;
          updates.deliveryTime = new Date().toISOString();
          updates.status = 'delivered';
          toast({
            title: 'Delivery Confirmed',
            description: 'Payment released. Customer notified.',
          });
        }

        updateDelivery(updates);
      }
    }
  };

  const handleRatingSubmit = (rating: number, feedback: string) => {
    addRating({
      id: `rating_${Date.now()}`,
      fromUserId: user?.id || '',
      fromUserName: user?.name || '',
      toUserId: ratingDialog.toUserId,
      toUserName: ratingDialog.toUserName,
      roleType: ratingDialog.roleType,
      rating,
      feedback,
      orderId: ratingDialog.orderId,
      createdAt: new Date().toISOString(),
      canEdit: true
    });

    toast({
      title: 'Rating Submitted',
      description: `You rated ${ratingDialog.toUserName} ${rating} stars`,
    });
  };

  const handleStatusUpdate = (deliveryId: string, newStatus: DeliveryStatus) => {
    const delivery = riderDeliveries.find(d => d.id === deliveryId);
    if (delivery) {
      updateDelivery({
        ...delivery,
        status: newStatus,
        updatedAt: new Date().toISOString()
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
                    toUserId: delivery.vendorId,
                    toUserName: delivery.vendorName,
                    roleType: 'vendor',
                    orderId: delivery.id
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

  const activeDeliveries = riderDeliveries.filter(d => d.status === 'assigned' || d.status === 'in_transit');
  const completedDeliveries = riderDeliveries.filter(d => d.status === 'delivered' || d.status === 'failed');

  // Calculate map center based on active deliveries
  const mapCenter: [number, number] = useMemo(() => {
    if (activeDeliveries.length > 0 && activeDeliveries[0].customerLocationLat && activeDeliveries[0].customerLocationLng) {
      return [activeDeliveries[0].customerLocationLat, activeDeliveries[0].customerLocationLng];
    }
    return [40.7128, -74.0060]; // Default to NYC
  }, [activeDeliveries]);

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
              <p className="text-3xl font-bold">{activeDeliveries.length}</p>
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
                {completedDeliveries.filter(d => d.status === 'delivered').length}
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
            {/* Active Deliveries */}
            {activeDeliveries.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>
                <div className="space-y-4">
                  {activeDeliveries.map((delivery) => {
                    const statusConfig = getStatusConfig(delivery.status);
                    const StatusIcon = statusConfig.icon;
                    const deliveryPayment = payments.find(p => p.orderId === delivery.id);

                    return (
                      <Card key={delivery.id} className="border-2 border-primary/20">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">Order #{delivery.id}</CardTitle>
                                <Badge variant={statusConfig.variant} className="gap-1">
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                              <CardDescription>
                                {format(new Date(delivery.createdAt), 'MMM dd, yyyy • hh:mm a')}
                              </CardDescription>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">KES {delivery.totalAmount.toFixed(2)}</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium mb-1">{delivery.customerName}</p>
                                <p className="text-sm text-muted-foreground">{delivery.customerAddress}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <Phone className="w-5 h-5 text-primary shrink-0" />
                              <a
                                href={`tel:${delivery.customerPhone}`}
                                className="text-sm font-medium text-primary hover:underline"
                              >
                                {delivery.customerPhone}
                              </a>
                            </div>
                          </div>

                          <div>
                            <p className="text-sm font-medium mb-2">Items:</p>
                            <div className="space-y-1">
                              {delivery.products.map((product, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span>{product.quantity}x {product.productName}</span>
                                  <span className="text-muted-foreground">
                                    KES {(product.price * product.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {delivery.notes && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <p className="text-xs font-medium text-yellow-900 dark:text-yellow-200 mb-1">Special Instructions:</p>
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">{delivery.notes}</p>
                            </div>
                          )}

                          {/* Add verification buttons */}
                          {delivery.status === 'assigned' && !delivery.pickupConfirmed && (
                            <Button
                              onClick={() => setVerificationDialog({
                                open: true,
                                order: delivery,
                                type: 'pickup'
                              })}
                              className="w-full"
                            >
                              Confirm Pickup from Vendor
                            </Button>
                          )}

                          {delivery.status === 'in_transit' && !delivery.deliveryConfirmed && (
                            <Button
                              onClick={() => setVerificationDialog({
                                open: true,
                                order: delivery,
                                type: 'delivery'
                              })}
                              className="w-full"
                            >
                              Confirm Delivery to Customer
                            </Button>
                          )}

                          {/* Show payment status */}
                          {deliveryPayment && (
                            <PaymentStatusCard payment={deliveryPayment} />
                          )}

                          <div className="pt-3 border-t">
                            <Label className="text-sm font-medium mb-2 block">Update Status</Label>
                            <Select
                              value={delivery.status}
                              onValueChange={(value) => handleStatusUpdate(delivery.id, value as DeliveryStatus)}
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

                          {delivery.status === 'delivered' && (
                            <div className="pt-3 border-t space-y-2">
                              <Label className="text-sm font-medium">Rate this delivery</Label>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={() => setRatingDialog({
                                    open: true,
                                    toUserId: delivery.vendorId,
                                    toUserName: delivery.vendorName,
                                    roleType: 'vendor',
                                    orderId: delivery.id
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
                                    toUserId: delivery.id, // Using delivery ID as customer identifier
                                    toUserName: delivery.customerName,
                                    roleType: 'customer',
                                    orderId: delivery.id
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

            {/* Completed Deliveries */}
            {completedDeliveries.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Completed Deliveries</h3>
                <div className="space-y-3">
                  {completedDeliveries.map((delivery) => {
                    const statusConfig = getStatusConfig(delivery.status);
                    const StatusIcon = statusConfig.icon;
                    const hasRatedCustomer = hasRated(delivery.id, delivery.customerId || '');
                    const hasRatedVendor = hasRated(delivery.id, delivery.vendorId);

                    return (
                      <Card key={delivery.id} className="opacity-75">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="text-left">
                                <p className="font-semibold">Order #{delivery.id}</p>
                                <p className="text-xs text-muted-foreground">{delivery.customerName}</p>
                              </div>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <p className="font-bold">KES {delivery.totalAmount.toFixed(2)}</p>
                          </div>
                        </CardHeader>
                        {delivery.status === 'delivered' && (
                          <CardContent className="pt-0">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={hasRatedCustomer ? "secondary" : "outline"}
                                className="flex-1 gap-2"
                                disabled={hasRatedCustomer}
                                onClick={() => setRatingDialog({
                                  open: true,
                                  toUserId: delivery.customerId || '',
                                  toUserName: delivery.customerName,
                                  roleType: 'customer',
                                  orderId: delivery.id
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
                                  toUserId: delivery.vendorId,
                                  toUserName: delivery.vendorName,
                                  roleType: 'vendor',
                                  orderId: delivery.id
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

            {riderDeliveries.length === 0 && (
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
            {activeDeliveries.length > 0 ? (
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
                        
                        {activeDeliveries.map((delivery) => (
                          <div key={delivery.id}>
                            {/* Customer Location */}
                            {delivery.customerLocationLat && delivery.customerLocationLng && (
                              <Marker position={[delivery.customerLocationLat, delivery.customerLocationLng]}>
                                <Popup>
                                  <div className="text-center">
                                    <p className="font-semibold">{delivery.customerName}</p>
                                    <p className="text-sm text-muted-foreground">Order #{delivery.id}</p>
                                    <p className="text-sm font-medium">KES {delivery.totalAmount.toFixed(2)}</p>
                                  </div>
                                </Popup>
                              </Marker>
                            )}

                            {/* Route Line */}
                            {delivery.riderLocationLat && delivery.riderLocationLng &&
                             delivery.customerLocationLat && delivery.customerLocationLng && (
                              <Polyline
                                positions={[
                                  [delivery.riderLocationLat, delivery.riderLocationLng],
                                  [delivery.customerLocationLat, delivery.customerLocationLng]
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
                      {activeDeliveries.map((delivery) => {
                        const statusConfig = getStatusConfig(delivery.status);
                        const StatusIcon = statusConfig.icon;

                        return (
                          <div key={delivery.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-sm">Order #{delivery.id}</p>
                                <p className="text-xs text-muted-foreground">{delivery.customerName}</p>
                              </div>
                              <Badge variant={statusConfig.variant} className="gap-1">
                                <StatusIcon className="w-3 h-3" />
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                              <MapPin className="w-3 h-3" />
                              <span className="line-clamp-1">{delivery.customerAddress}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-bold">KES {delivery.totalAmount.toFixed(2)}</span>
                              <Select
                                value={delivery.status}
                                onValueChange={(value) => handleStatusUpdate(delivery.id, value as DeliveryStatus)}
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