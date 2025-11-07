import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, User, MapPin, Star, Bike, Clock } from 'lucide-react';
import RatingDialog from '@/components/RatingDialog';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';

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
    orders.filter(o => o.customer_id === user?.id),
    [orders, user?.id]
  );

  const hasRated = (orderId: string, toUserId: string) => {
    return ratings.some(r => 
      r.from_user_id === user?.id && 
      r.to_user_id === toUserId && 
      r.order_id === orderId
    );
  };

  const formatOrderDate = (dateString: string | undefined) => {
    if (!dateString) return 'Date not available';
    
    try {
      // Parse the date string - Supabase returns ISO 8601 format
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Date not available';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Date not available';
    }
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
            const hasRatedVendor = hasRated(order.id, order.vendor_id);
            const hasRatedRider = order.rider_id ? hasRated(order.id, order.rider_id) : false;

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
                          {formatOrderDate(order.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">KES {order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 border-2 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-bold">Vendor</p>
                          <p className="text-sm font-semibold">{order.vendor_name}</p>
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
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Products:</h4>
                          {order.products.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>
                                {item.quantity}x {item.productName}
                                {item.unit_label && (
                                  <span className="text-muted-foreground ml-1">
                                    ({formatUnitLabel(item.unit_type, item.unit_value, item.unit_label)})
                                  </span>
                                )}
                              </span>
                              <span>KES {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rider Info */}
                    {order.rider_name && (
                      <div className="flex items-center gap-3 p-4 bg-blue-950/50 border-2 border-blue-800 rounded-lg">
                        <Bike className="w-5 h-5 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm font-bold">Assigned Rider</p>
                          <p className="text-sm font-medium text-muted-foreground">{order.rider_name}</p>
                        </div>
                        {order.eta_minutes && (
                          <div className="flex items-center gap-1 text-sm font-medium">
                            <Clock className="w-4 h-4" />
                            <span>{order.eta_minutes} min</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Delivery Code for Active Orders */}
                    {order.delivery_code && (order.status === 'pending' || order.status === 'assigned' || order.status === 'in_transit') && (
                      <div className="p-4 border-2 border-border rounded-lg text-center">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">YOUR DELIVERY CODE</p>
                        <p className="text-3xl font-bold tracking-[0.3em]">{order.delivery_code}</p>
                        <p className="text-xs text-muted-foreground mt-2">Share this code with the rider upon delivery</p>
                      </div>
                    )}

                    {/* Rating Buttons for Delivered Orders */}
                    {order.status === 'delivered' && (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={hasRated(order.id, order.vendor_id) ? "secondary" : "default"}
                          disabled={hasRated(order.id, order.vendor_id)}
                          onClick={() => setRatingDialog({
                            open: true,
                            toUserId: order.vendor_id,
                            toUserName: order.vendor_name,
                            roleType: 'vendor',
                            orderId: order.id
                          })}
                        >
                          <Star className={`w-4 h-4 mr-2 ${hasRated(order.id, order.vendor_id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          {hasRated(order.id, order.vendor_id) ? 'Vendor Rated' : 'Rate Vendor'}
                        </Button>
                        {order.rider_id && order.rider_name && (
                          <Button
                            variant={hasRated(order.id, order.rider_id) ? "secondary" : "default"}
                            disabled={hasRated(order.id, order.rider_id)}
                            onClick={() => setRatingDialog({
                              open: true,
                              toUserId: order.rider_id!,
                              toUserName: order.rider_name!,
                              roleType: 'rider',
                              orderId: order.id
                            })}
                          >
                            <Star className={`w-4 h-4 mr-2 ${hasRated(order.id, order.rider_id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            {hasRated(order.id, order.rider_id) ? 'Rider Rated' : 'Rate Rider'}
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