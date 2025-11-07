import { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Clock, MapPin, Phone, Package, User, Bike, CheckCircle, AlertCircle, Star } from 'lucide-react';
import { Order, DeliveryStatus } from '@/types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const statusColors: Record<DeliveryStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  in_transit: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  assigned: 'Preparing',
  in_transit: 'Out for Delivery',
  delivered: 'Completed',
  failed: 'Failed',
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function OrderManagement() {
  const { orders, updateOrder, riders, updateRider, products, updateProduct } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [assignRiderDialog, setAssignRiderDialog] = useState<{ open: boolean; order: Order | null }>({
    open: false,
    order: null
  });
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');

  const vendorOrders = orders.filter(o => o.vendor_id === user?.id);

  const filteredOrders = filterStatus === 'all' 
    ? vendorOrders 
    : vendorOrders.filter(o => o.status === filterStatus);

  const handleAssignRider = () => {
    if (!assignRiderDialog.order || !selectedRiderId) return;

    const rider = riders.find(r => r.id === selectedRiderId);
    if (!rider) return;

    // Calculate ETA based on distance
    const riderDistance = rider.location_lat && rider.location_lng && assignRiderDialog.order.vendor_location_lat && assignRiderDialog.order.vendor_location_lng
      ? calculateDistance(
          rider.location_lat,
          rider.location_lng,
          assignRiderDialog.order.vendor_location_lat,
          assignRiderDialog.order.vendor_location_lng
        )
      : 0;

    const etaToVendor = Math.ceil(riderDistance * 3); // ~3 min per km
    const etaToCustomer = assignRiderDialog.order.eta_minutes || 20;

    const updatedOrder = {
      ...assignRiderDialog.order,
      rider_id: rider.id,
      rider_name: rider.name,
      rider_location_lat: rider.location_lat,
      rider_location_lng: rider.location_lng,
      status: 'assigned' as DeliveryStatus,
      eta_minutes: etaToVendor + etaToCustomer,
      updated_at: new Date().toISOString(),
    };

    updateOrder(updatedOrder);

    // Update rider status
    updateRider({
      ...rider,
      status: 'busy',
      active_deliveries: (rider.active_deliveries || 0) + 1,
    });

    toast({
      title: '✅ Rider Assigned Successfully',
      description: `${rider.name} will arrive in ~${etaToVendor} minutes to pick up the order`,
    });

    setAssignRiderDialog({ open: false, order: null });
    setSelectedRiderId('');
  };

  const handleStatusUpdate = (order: Order, newStatus: DeliveryStatus) => {
    const updatedOrder = {
      ...order,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    // If marking as in_transit, set pickup time
    if (newStatus === 'in_transit' && !order.pickup_time) {
      updatedOrder.pickup_time = new Date().toISOString();
      updatedOrder.pickup_confirmed = true;
    }

    // If marking as delivered, set delivery time
    if (newStatus === 'delivered' && !order.delivery_time) {
      updatedOrder.delivery_time = new Date().toISOString();
      updatedOrder.delivery_confirmed = true;
    }

    updateOrder(updatedOrder);

    toast({
      title: 'Order Updated',
      description: `Order status changed to ${statusLabels[newStatus]}`,
    });
  };

  const getAvailableActions = (order: Order) => {
    const actions: { label: string; status?: DeliveryStatus; action?: () => void; variant?: 'default' | 'outline' }[] = [];

    if (order.status === 'pending' && !order.rider_id) {
      actions.push({ 
        label: 'Assign Rider', 
        action: () => {
          setAssignRiderDialog({ open: true, order });
          setSelectedRiderId('');
        },
        variant: 'default'
      });
    }

    if (order.status === 'pending' && order.rider_id) {
      actions.push({ label: 'Mark as Preparing', status: 'assigned' });
    }

    if (order.status === 'assigned') {
      actions.push({ label: 'Ready for Pickup', status: 'assigned', variant: 'outline' });
    }

    return actions;
  };

  const getRiderInfo = (riderId?: string | null) => {
    if (!riderId) return null;
    return riders.find(r => r.id === riderId);
  };

  // Get available riders sorted by distance from vendor
  const getAvailableRiders = (order: Order) => {
    const availableRiders = riders.filter(r => r.status === 'available');
    
    if (!order.vendor_location_lat || !order.vendor_location_lng) {
      return availableRiders;
    }

    return availableRiders.map(rider => {
      const distance = rider.location_lat && rider.location_lng
        ? calculateDistance(
            order.vendor_location_lat!,
            order.vendor_location_lng!,
            rider.location_lat,
            rider.location_lng
          )
        : 999;
      
      return { ...rider, distanceFromVendor: distance };
    }).sort((a, b) => a.distanceFromVendor - b.distanceFromVendor);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Customer Orders</CardTitle>
              <CardDescription className="text-base font-medium">Manage incoming orders and assign riders</CardDescription>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] border-2 font-semibold bg-background">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Preparing</SelectItem>
                <SelectItem value="in_transit">Out for Delivery</SelectItem>
                <SelectItem value="delivered">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const rider = getRiderInfo(order.rider_id);
                return (
                  <Card key={order.id} className="border-2 bg-card">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">Order #{order.id.slice(-6)}</h3>
                              <Badge className={statusColors[order.status]}>
                                {statusLabels[order.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">KES {order.total_amount.toFixed(2)}</p>
                          </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex items-center justify-between p-4 bg-muted/50 border-2 rounded-lg">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5" />
                            <div>
                              <p className="text-sm font-bold">Customer</p>
                              <p className="text-sm font-semibold">{order.customer_name}</p>
                            </div>
                          </div>
                          {order.distance_km && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm font-semibold">{order.distance_km.toFixed(1)} km away</span>
                            </div>
                          )}
                        </div>

                        {/* Products */}
                        <div>
                          <p className="text-base font-bold mb-3">Order Items</p>
                          <div className="space-y-2 border-2 rounded-lg p-4 bg-muted/30">
                            {order.products.map((product, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm p-4 bg-background border-2 rounded-md">
                                <span className="font-semibold">{product.product_name} x {product.quantity}</span>
                                <span className="font-bold">KES {(product.price * product.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Rider Info */}
                        {rider && (
                          <div className="flex items-center gap-3 p-4 bg-blue-950/50 border-2 border-blue-800 rounded-lg">
                            <Bike className="w-5 h-5 text-blue-400" />
                            <div className="flex-1">
                              <p className="text-sm font-bold">Assigned Rider</p>
                              <p className="text-sm font-medium text-muted-foreground">{rider.name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm font-medium">{rider.phone}</span>
                            </div>
                            {order.eta_minutes && (
                              <div className="flex items-center gap-1 text-sm font-medium">
                                <Clock className="w-4 h-4" />
                                <span>{order.eta_minutes} min</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          {getAvailableActions(order).map((action, idx) => (
                            <Button
                              key={idx}
                              variant={action.variant || 'default'}
                              onClick={() => action.action ? action.action() : action.status && handleStatusUpdate(order, action.status)}
                            >
                              {action.label}
                            </Button>
                          ))}
                          {order.customer_location_lat && order.customer_location_lng && (
                            <Button
                              variant="outline"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <MapPin className="w-4 h-4 mr-2" />
                              View Map
                            </Button>
                          )}
                        </div>

                        {/* Notes */}
                        {order.notes && (
                          <div className="flex items-start gap-2 p-3 bg-amber-950/50 border border-amber-800 rounded">
                            <AlertCircle className="w-4 h-4 mt-0.5 text-amber-400" />
                            <div>
                              <p className="text-sm font-medium text-amber-200">Delivery Notes</p>
                              <p className="text-sm text-amber-300">{order.notes}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Rider Dialog */}
      <Dialog open={assignRiderDialog.open} onOpenChange={(open) => {
        setAssignRiderDialog({ open, order: assignRiderDialog.order });
        if (!open) setSelectedRiderId('');
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Rider to Order #{assignRiderDialog.order?.id.slice(-6)}</DialogTitle>
            <DialogDescription>
              Select an available rider near your location
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {assignRiderDialog.order && getAvailableRiders(assignRiderDialog.order).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bike className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No riders available at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignRiderDialog.order && getAvailableRiders(assignRiderDialog.order).map((rider) => (
                  <Card 
                    key={rider.id} 
                    className={`cursor-pointer transition-all ${
                      selectedRiderId === rider.id 
                        ? 'border-2 border-primary bg-primary/5' 
                        : 'border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedRiderId(rider.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bike className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold">{rider.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{rider.distanceFromVendor.toFixed(1)} km away</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold">{rider.rating?.toFixed(1) || '5.0'}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {rider.total_deliveries || 0} deliveries
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAssignRiderDialog({ open: false, order: null });
              setSelectedRiderId('');
            }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAssignRider} 
              disabled={!selectedRiderId}
            >
              Assign Rider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      {selectedOrder && selectedOrder.customer_location_lat && selectedOrder.customer_location_lng && (
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Delivery Location - Order #{selectedOrder.id.slice(-6)}</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedOrder(null)}>
                Close Map
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <MapContainer
                center={[selectedOrder.customer_location_lat, selectedOrder.customer_location_lng]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[selectedOrder.customer_location_lat, selectedOrder.customer_location_lng]}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-semibold">{selectedOrder.customer_name}</p>
                      <p className="text-muted-foreground">Delivery Location</p>
                    </div>
                  </Popup>
                </Marker>
                {selectedOrder.rider_location_lat && selectedOrder.rider_location_lng && (
                  <Marker position={[selectedOrder.rider_location_lat, selectedOrder.rider_location_lng]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{selectedOrder.rider_name}</p>
                        <p className="text-muted-foreground">Rider Location</p>
                      </div>
                    </Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}