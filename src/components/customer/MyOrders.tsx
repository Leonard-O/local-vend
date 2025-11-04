import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, User, MapPin, Star, Bike, Clock } from 'lucide-react';
import RatingDialog from '@/components/RatingDialog';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  in_transit: 'bg-purple-100 text-purple-800 border-purple-300',
  delivered: 'bg-green-100 text-green-800 border-green-300',
  failed: 'bg-red-100 text-red-800 border-red-300',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Preparing',
  in_transit: 'Out for Delivery',
  delivered: 'Completed',
  failed: 'Failed',
};

export default function MyOrders() {
  const { user } = useAuth();
  const { orders, ratings } = useData();
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
    roleType: 'vendor'
  });

  const customerOrders = useMemo(() => 
    orders.filter(o => o.customerId === user?.id),
    [orders, user?.id]
  );

  const hasRated = (orderId: string, toUserId: string) => {
    return ratings.some(r => 
      r.fromUserId === user?.id && 
      r.toUserId === toUserId && 
      r.orderId === orderId
    );
  };

  const handleCloseRatingDialog = (open: boolean) => {
    if (!open) {
      setRatingDialog({
        open: false,
        toUserId: '',
        toUserName: '',
        roleType: 'vendor'
      });
    } else {
      setRatingDialog({ ...ratingDialog, open });
    }
  };

  return (
    <div className="space-y-6">
      {customerOrders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No orders yet</p>
          <p className="text-sm mt-2">Start shopping to see your orders here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {customerOrders.map((order) => {
            const hasRatedVendor = hasRated(order.id, order.vendorId);
            const hasRatedRider = order.riderId ? hasRated(order.id, order.riderId) : false;

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
                          {new Date(order.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">KES {order.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 border-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-bold">Vendor</p>
                          <p className="text-sm font-semibold">{order.vendorName}</p>
                        </div>
                      </div>
                      {order.distanceKm && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="text-sm font-semibold">{order.distanceKm.toFixed(1)} km away</span>
                        </div>
                      )}
                    </div>

                    {/* Products */}
                    <div>
                      <p className="text-base font-bold mb-3">Order Items</p>
                      <div className="space-y-2 border-2 rounded-lg p-4 bg-muted/30">
                        {order.products.map((product, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm p-4 bg-background border-2 rounded-md">
                            <span className="font-semibold">{product.productName} x {product.quantity}</span>
                            <span className="font-bold">KES {(product.price * product.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Rider Info */}
                    {order.riderName && (
                      <div className="flex items-center gap-3 p-4 bg-blue-950/50 border-2 border-blue-800 rounded-lg">
                        <Bike className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-bold">Assigned Rider</p>
                          <p className="text-sm font-medium text-muted-foreground">{order.riderName}</p>
                        </div>
                        {order.etaMinutes && (
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            <span>{order.etaMinutes} min</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery Code for Active Orders */}
                    {order.deliveryCode && (order.status === 'pending' || order.status === 'assigned' || order.status === 'in_transit') && (
                      <div className="p-4 border-2 border-border rounded-lg text-center">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">YOUR DELIVERY CODE</p>
                        <p className="text-3xl font-bold tracking-[0.3em]">{order.deliveryCode}</p>
                        <p className="text-xs text-muted-foreground mt-2">Share this code with the rider upon delivery</p>
                      </div>
                    )}

                    {/* Rating Buttons for Delivered Orders */}
                    {order.status === 'delivered' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={hasRatedVendor ? "secondary" : "default"}
                          disabled={hasRatedVendor}
                          onClick={() => setRatingDialog({
                            open: true,
                            toUserId: order.vendorId,
                            toUserName: order.vendorName,
                            roleType: 'vendor',
                            orderId: order.id
                          })}
                        >
                          <Star className={`w-4 h-4 mr-2 ${hasRatedVendor ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          {hasRatedVendor ? 'Vendor Rated' : 'Rate Vendor'}
                        </Button>
                        {order.riderId && order.riderName && (
                          <Button
                            variant={hasRatedRider ? "secondary" : "default"}
                            disabled={hasRatedRider}
                            onClick={() => setRatingDialog({
                              open: true,
                              toUserId: order.riderId!,
                              toUserName: order.riderName!,
                              roleType: 'rider',
                              orderId: order.id
                            })}
                          >
                            <Star className={`w-4 h-4 mr-2 ${hasRatedRider ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            {hasRatedRider ? 'Rider Rated' : 'Rate Rider'}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <RatingDialog
        open={ratingDialog.open}
        onOpenChange={handleCloseRatingDialog}
        toUserId={ratingDialog.toUserId}
        toUserName={ratingDialog.toUserName}
        roleType={ratingDialog.roleType}
        orderId={ratingDialog.orderId}
      />
    </div>
  );
}