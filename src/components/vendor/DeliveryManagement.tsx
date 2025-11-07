import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Truck, MapPin, Phone, Clock, CheckCircle, XCircle, Package, Plus, Star } from 'lucide-react';
import { DeliveryStatus } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import CreateDeliveryDialog from './CreateDeliveryDialog';
import RatingDialog from '@/components/RatingDialog';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';

export default function DeliveryManagement() {
  const { user } = useAuth();
  const { deliveries, riders, updateDelivery, ratings } = useData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
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
    roleType: 'rider'
  });

  const vendorDeliveries = useMemo(() => 
    deliveries.filter(d => d.vendorId === user?.id),
    [deliveries, user?.id]
  );

  const activeDeliveries = vendorDeliveries.filter(d => 
    d.status === 'pending' || d.status === 'assigned' || d.status === 'in_transit'
  );
  
  const completedDeliveries = vendorDeliveries.filter(d => 
    d.status === 'delivered' || d.status === 'failed'
  );

  const hasRated = (orderId: string, toUserId: string) => {
    return ratings.some(r => 
      r.fromUserId === user?.id && 
      r.toUserId === toUserId && 
      r.orderId === orderId
    );
  };

  const getStatusConfig = (status: DeliveryStatus) => {
    const configs = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock, color: 'text-yellow-600' },
      assigned: { label: 'Assigned', variant: 'default' as const, icon: Truck, color: 'text-blue-600' },
      in_transit: { label: 'In Transit', variant: 'default' as const, icon: Truck, color: 'text-blue-600' },
      delivered: { label: 'Delivered', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      failed: { label: 'Failed', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
    };
    return configs[status];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Delivery Management</h2>
          <p className="text-muted-foreground">
            Create and manage your deliveries
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Create Delivery
        </Button>
      </div>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Active Deliveries</h3>
          <div className="space-y-4">
            {activeDeliveries.map((delivery) => {
              const statusConfig = getStatusConfig(delivery.status);
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
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
                        <p className="text-2xl font-bold text-foreground">
                          ${delivery.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Customer</p>
                          <p className="text-sm font-medium">{delivery.customerName}</p>
                          <p className="text-xs text-muted-foreground">{delivery.customerPhone}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Delivery Address</p>
                          <p className="text-sm">{delivery.customerAddress}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {delivery.riderName && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Assigned Rider</p>
                            <p className="text-sm font-medium">{delivery.riderName}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Products</p>
                          <div className="space-y-1">
                            {delivery.products.map((product, idx) => (
                              <p key={idx} className="text-sm">
                                {product.quantity}x {product.productName}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    {delivery.notes && (
                      <div className="pt-3 border-t">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm">{delivery.notes}</p>
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
              const hasRatedRider = delivery.riderId ? hasRated(delivery.id, delivery.riderId) : true;
              const hasRatedCustomer = hasRated(delivery.id, delivery.customerId || '');

              return (
                <Card key={delivery.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <p className="font-semibold">Order #{delivery.id}</p>
                          <p className="text-xs text-muted-foreground">
                            {delivery.customerName}
                            {delivery.riderName && ` • Rider: ${delivery.riderName}`}
                          </p>
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
                        {delivery.riderId && delivery.riderName && (
                          <Button
                            size="sm"
                            variant={hasRatedRider ? "secondary" : "outline"}
                            className="flex-1 gap-2"
                            disabled={hasRatedRider}
                            onClick={() => setRatingDialog({
                              open: true,
                              toUserId: delivery.riderId!,
                              toUserName: delivery.riderName!,
                              roleType: 'rider',
                              orderId: delivery.id
                            })}
                          >
                            <Star className={`w-4 h-4 ${hasRatedRider ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            {hasRatedRider ? 'Rider Rated' : 'Rate Rider'}
                          </Button>
                        )}
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
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {deliveries.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Truck className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No deliveries yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Create your first delivery to start managing orders
            </p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Create Your First Delivery
            </Button>
          </div>
        </Card>
      )}

      <CreateDeliveryDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <RatingDialog
        open={ratingDialog.open}
        onOpenChange={(open) => setRatingDialog({ ...ratingDialog, open })}
        toUserId={ratingDialog.toUserId}
        toUserName={ratingDialog.toUserName}
        roleType={ratingDialog.roleType}
        orderId={ratingDialog.orderId}
      />
    </div>
  );
}