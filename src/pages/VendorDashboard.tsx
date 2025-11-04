import { useState } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import ProductManagement from '@/components/vendor/ProductManagement';
import DeliveryManagement from '@/components/vendor/DeliveryManagement';
import OrderManagement from '@/components/vendor/OrderManagement';
import PaymentStatusCard from '@/components/PaymentStatusCard';
import EnhancedRatingDialog from '@/components/EnhancedRatingDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Truck, BarChart3, Map, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('orders');
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
  const { products, deliveries, orders, payments, addRating } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const vendorProducts = products.filter(p => p.vendorId === user?.id);
  const vendorDeliveries = deliveries.filter(d => d.vendorId === user?.id);
  const vendorOrders = orders.filter(o => o.vendorId === user?.id);
  const vendorPayments = payments.filter(p => p.vendorId === user?.id);

  const totalRevenue = vendorPayments
    .filter(p => p.status === 'released')
    .reduce((sum, p) => sum + p.vendorShare, 0);

  const pendingRevenue = vendorPayments
    .filter(p => p.status === 'held')
    .reduce((sum, p) => sum + p.vendorShare, 0);

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Vendor Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your products, inventory, and deliveries
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{vendorOrders.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {vendorOrders.filter(o => o.status === 'assigned' || o.status === 'in_transit').length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Revenue (Released)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">KES {totalRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">KES {pendingRevenue.toFixed(2)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-4">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="deliveries" className="gap-2">
              <Truck className="w-4 h-4" />
              Deliveries
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="deliveries">
            <DeliveryManagement />
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Payment Overview</CardTitle>
                <CardDescription>Track your earnings and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Total Released</p>
                    <p className="text-2xl font-bold text-green-900">KES {totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-700 mb-1">Pending Release</p>
                    <p className="text-2xl font-bold text-amber-900">KES {pendingRevenue.toFixed(2)}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Recent Payments</h3>
                  {vendorPayments.length > 0 ? (
                    vendorPayments.map((payment) => (
                      <PaymentStatusCard key={payment.id} payment={payment} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No payment records yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}