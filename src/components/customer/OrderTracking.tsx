import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Navigation, Clock, Package, CheckCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function OrderTracking() {
  const { orders, updateOrder } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [verifyDialog, setVerifyDialog] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const activeOrders = useMemo(() =>
    orders.filter(o => 
      o.customerId === user?.id && 
      (o.status === 'in_transit' || o.status === 'assigned')
    ),
    [orders, user?.id]
  );

  const selectedOrder = useMemo(() =>
    activeOrders.find(o => o.id === selectedOrderId) || activeOrders[0],
    [activeOrders, selectedOrderId]
  );

  const handleVerifyDelivery = () => {
    if (!selectedOrder) return;

    if (verificationCode === selectedOrder.deliveryCode) {
      updateOrder({
        ...selectedOrder,
        status: 'delivered',
        updatedAt: new Date().toISOString()
      });

      toast({
        title: 'Delivery Confirmed!',
        description: 'Your order has been successfully delivered.',
      });

      setVerifyDialog(false);
      setVerificationCode('');
    } else {
      toast({
        title: 'Invalid Code',
        description: 'The verification code does not match. Please try again.',
        variant: 'destructive'
      });
    }
  };

  if (activeOrders.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No Active Deliveries</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            You don't have any orders in transit at the moment
          </p>
        </div>
      </Card>
    );
  }

  const mapCenter: [number, number] = selectedOrder?.customerLocationLat && selectedOrder?.customerLocationLng
    ? [selectedOrder.customerLocationLat, selectedOrder.customerLocationLng]
    : [40.7128, -74.0060];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Track Your Order</h2>
          <p className="text-muted-foreground">
            Real-time tracking of your active deliveries
          </p>
        </div>

        {activeOrders.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {activeOrders.map((order) => (
              <Button
                key={order.id}
                variant={selectedOrderId === order.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedOrderId(order.id)}
              >
                Order #{order.id}
              </Button>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Map */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Live Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] rounded-lg overflow-hidden border">
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    
                    {/* Customer Location */}
                    {selectedOrder.customerLocationLat && selectedOrder.customerLocationLng && (
                      <Marker position={[selectedOrder.customerLocationLat, selectedOrder.customerLocationLng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">Your Location</p>
                            <p className="text-sm text-muted-foreground">{selectedOrder.customerName}</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Vendor Location */}
                    {selectedOrder.vendorLocationLat && selectedOrder.vendorLocationLng && (
                      <Marker position={[selectedOrder.vendorLocationLat, selectedOrder.vendorLocationLng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">{selectedOrder.vendorName}</p>
                            <p className="text-sm text-muted-foreground">Vendor</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Rider Location */}
                    {selectedOrder.riderLocationLat && selectedOrder.riderLocationLng && (
                      <Marker position={[selectedOrder.riderLocationLat, selectedOrder.riderLocationLng]}>
                        <Popup>
                          <div className="text-center">
                            <p className="font-semibold">{selectedOrder.riderName}</p>
                            <p className="text-sm text-muted-foreground">Rider</p>
                          </div>
                        </Popup>
                      </Marker>
                    )}

                    {/* Route Line */}
                    {selectedOrder.riderLocationLat && selectedOrder.riderLocationLng &&
                     selectedOrder.customerLocationLat && selectedOrder.customerLocationLng && (
                      <Polyline
                        positions={[
                          [selectedOrder.riderLocationLat, selectedOrder.riderLocationLng],
                          [selectedOrder.customerLocationLat, selectedOrder.customerLocationLng]
                        ]}
                        color="blue"
                        weight={3}
                        opacity={0.7}
                        dashArray="10, 10"
                      />
                    )}
                  </MapContainer>
                </div>
              </CardContent>
            </Card>

            {/* Order Details */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Order #{selectedOrder.id}</CardTitle>
                    <Badge variant="default" className="gap-1">
                      <Navigation className="w-3 h-3" />
                      {selectedOrder.status === 'in_transit' ? 'In Transit' : 'Assigned'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Vendor</p>
                      <p className="text-sm font-medium">{selectedOrder.vendorName}</p>
                    </div>
                    {selectedOrder.riderName && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Rider</p>
                        <p className="text-sm font-medium">{selectedOrder.riderName}</p>
                      </div>
                    )}
                    {selectedOrder.distanceKm && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Distance</p>
                        <p className="text-sm font-medium">{selectedOrder.distanceKm.toFixed(1)} km</p>
                      </div>
                    )}
                    {selectedOrder.etaMinutes && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">ETA</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedOrder.etaMinutes} min
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Items</p>
                    <div className="space-y-1">
                      {selectedOrder.products.map((product, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{product.quantity}x {product.productName}</span>
                          <span className="text-muted-foreground">
                            ${(product.price * product.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-bold text-lg pt-2 mt-2 border-t">
                      <span>Total</span>
                      <span>${selectedOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedOrder.deliveryCode && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-xs font-medium text-muted-foreground mb-1">Delivery Code</p>
                      <p className="text-2xl font-mono font-bold">{selectedOrder.deliveryCode}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Share this code with the rider to confirm delivery
                      </p>
                    </div>
                  )}

                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => setVerifyDialog(true)}
                  >
                    <CheckCircle className="w-5 h-5" />
                    Verify Delivery
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* Verification Dialog */}
      <Dialog open={verifyDialog} onOpenChange={setVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Delivery</DialogTitle>
            <DialogDescription>
              Enter the code provided by the rider to confirm delivery
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Delivery Code</Label>
              <Input
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 4-digit code"
                maxLength={4}
                className="text-center text-2xl font-mono tracking-widest"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyDelivery}>
              Confirm Delivery
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
