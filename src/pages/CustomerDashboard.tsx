import { useState, useMemo } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import DeliveryCodeVerification from '@/components/DeliveryCodeVerification';
import EnhancedRatingDialog from '@/components/EnhancedRatingDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, MapPin, Star, Clock, Package, CheckCircle } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { VendorWithDistance } from '@/types';
import ProductSearchResults from '@/components/customer/ProductSearchResults';
import OrderTracking from '@/components/customer/OrderTracking';

function CustomerDashboard() {
  const { products, vendors, orders, updateOrder, addRating, payments } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State declarations
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VendorWithDistance[]>([]);
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
  const [verificationDialog, setVerificationDialog] = useState<{
    open: boolean;
    order: any;
  }>({
    open: false,
    order: null
  });

  const userOrders = orders.filter(order => order.customerId === user?.id);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Search query required",
        description: "Please enter a product name to search",
        variant: "destructive"
      });
      return;
    }

    const matchingProducts = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const vendorIds = [...new Set(matchingProducts.map(p => p.vendorId))];

    const results: VendorWithDistance[] = vendorIds
      .map(vendorId => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) return null;

        const vendorProducts = matchingProducts.filter(p => p.vendorId === vendorId);
        
        return {
          ...vendor,
          distance: Math.random() * 10 + 0.5,
          products: vendorProducts
        };
      })
      .filter((v): v is VendorWithDistance => v !== null)
      .sort((a, b) => a.distance - b.distance);

    setSearchResults(results);

    if (results.length === 0) {
      toast({
        title: "No results found",
        description: "No vendors found with matching products",
      });
    }
  };

  const stats = useMemo(() => ({
    totalOrders: userOrders.length,
    activeOrders: userOrders.filter(o => o.status === 'in_transit' || o.status === 'assigned').length,
    completedOrders: userOrders.filter(o => o.status === 'delivered').length,
  }), [userOrders]);

  const handleDeliveryConfirmation = (orderId: string, success: boolean) => {
    if (success) {
      const order = userOrders.find(o => o.id === orderId);
      if (order) {
        updateOrder({
          ...order,
          deliveryConfirmed: true,
          deliveryTime: new Date().toISOString(),
          status: 'delivered',
          updatedAt: new Date().toISOString()
        });

        toast({
          title: 'Delivery Confirmed',
          description: 'Payment has been released to vendor and rider. Please rate your experience!',
        });

        setTimeout(() => {
          setRatingDialog({
            open: true,
            toUserId: order.riderId || '',
            toUserName: order.riderName || '',
            roleType: 'rider',
            orderId: order.id
          });
        }, 1000);
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 h-auto">
            <TabsTrigger value="search" className="gap-2 py-3">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2 py-3">
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Orders</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="gap-2 py-3">
              <MapPin className="w-4 h-4" />
              <span className="hidden sm:inline">Track</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Find Products</h2>
              <p className="text-muted-foreground">
                Search for products from local vendors near you
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.totalOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Active Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.activeOrders}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{stats.completedOrders}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for products (e.g., bread, tomatoes, eggs)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      className="pl-10 h-12 text-base"
                    />
                  </div>
                  <Button onClick={handleSearch} size="lg" className="h-12">
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            <ProductSearchResults results={searchResults} searchQuery={searchQuery} />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">My Orders</h2>
              <p className="text-muted-foreground">
                Track and manage your orders
              </p>
            </div>

            {userOrders.length > 0 ? (
              <div className="space-y-4">
                {userOrders.map((order) => {
                  const orderPayment = payments.find(p => p.orderId === order.id);
                  
                  return (
                    <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Package className="w-5 h-5 text-primary" />
                              <CardTitle className="text-xl">Order #{order.id}</CardTitle>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{order.vendorName}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(order.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              order.status === 'delivered' ? 'default' : 
                              order.status === 'in_transit' ? 'default' : 
                              order.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-sm px-3 py-1"
                          >
                            {order.status === 'in_transit' ? 'In Transit' : 
                             order.status === 'delivered' ? 'Delivered' :
                             order.status === 'assigned' ? 'Assigned' :
                             order.status === 'failed' ? 'Failed' :
                             'Pending'}
                          </Badge>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-6 space-y-6">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-foreground uppercase tracking-wide">Order Items</p>
                          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                            {order.products && order.products.length > 0 ? order.products.map((product, idx) => {
                              const safePrice = Number(product?.price) || 0;
                              const safeQuantity = Number(product?.quantity) || 0;
                              const subtotal = safePrice * safeQuantity;
                              
                              return (
                                <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0 border-border/50">
                                  <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="font-mono">
                                      {safeQuantity}x
                                    </Badge>
                                    <span className="font-medium">{product?.productName || 'Unknown Product'}</span>
                                  </div>
                                  <span className="font-semibold text-lg">
                                    KES {subtotal.toFixed(2)}
                                  </span>
                                </div>
                              );
                            }) : (
                              <div className="text-center text-muted-foreground py-2">
                                No products in this order
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t-2 border-primary/20">
                          <span className="text-lg font-bold text-foreground">Total Amount</span>
                          <span className="text-2xl font-black text-primary">
                            KES {(Number(order.totalAmount) || 0).toFixed(2)}
                          </span>
                        </div>

                        {order.deliveryCode && (
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="text-center space-y-3">
                              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                                Your Delivery Code
                              </p>
                              <div className="bg-white/20 backdrop-blur-sm rounded-lg py-4 px-6">
                                <p className="text-5xl font-black tracking-[0.3em] font-mono">
                                  {order.deliveryCode}
                                </p>
                              </div>
                              <p className="text-xs opacity-90 max-w-xs mx-auto">
                                Share this code with the rider upon delivery
                              </p>
                            </div>
                          </div>
                        )}

                        {orderPayment && (
                          <div className="space-y-3">
                            <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                              Payment Breakdown
                            </p>
                            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-5 space-y-3 border border-slate-200 dark:border-slate-700">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Order #</span>
                                <span className="font-semibold text-foreground">{orderPayment.orderId}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Total Amount</span>
                                <span className="font-bold text-foreground">KES {(Number(orderPayment.totalAmount) || 0).toFixed(2)}</span>
                              </div>
                              <div className="h-px bg-border my-2"></div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Vendor Share</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  KES {(Number(orderPayment.vendorShare) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Rider Fee</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  KES {(Number(orderPayment.riderFee) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Platform Fee</span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  KES {(Number(orderPayment.platformFee) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="h-px bg-border my-2"></div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-semibold text-foreground">Payment Status</span>
                                <Badge variant={orderPayment.status === 'completed' ? 'default' : 'secondary'}>
                                  {orderPayment.status === 'held' ? 'Held in Escrow' : 
                                   orderPayment.status === 'completed' ? 'Released' : 
                                   'Processing'}
                                </Badge>
                              </div>
                              {orderPayment.status === 'held' && (
                                <p className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                                  💡 Payment is held in escrow. It will be released once the customer confirms delivery.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 pt-2">
                          {order.status === 'in_transit' && !order.deliveryConfirmed && (
                            <Button
                              onClick={() => setVerificationDialog({
                                open: true,
                                order: order
                              })}
                              className="w-full h-12 text-base font-semibold"
                              size="lg"
                            >
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Confirm Delivery Received
                            </Button>
                          )}

                          {order.status === 'delivered' && (
                            <div className="grid grid-cols-2 gap-3">
                              <Button
                                variant="outline"
                                className="h-11 font-medium"
                                onClick={() => setRatingDialog({
                                  open: true,
                                  toUserId: order.riderId || '',
                                  toUserName: order.riderName || '',
                                  roleType: 'rider',
                                  orderId: order.id
                                })}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Rate Rider
                              </Button>
                              <Button
                                variant="outline"
                                className="h-11 font-medium"
                                onClick={() => setRatingDialog({
                                  open: true,
                                  toUserId: order.vendorId,
                                  toUserName: order.vendorName,
                                  roleType: 'vendor',
                                  orderId: order.id
                                })}
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Rate Vendor
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Start shopping to place your first order!
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tracking">
            <OrderTracking />
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
          verificationType="delivery"
          onVerify={(success) => handleDeliveryConfirmation(verificationDialog.order.id, success)}
        />
      )}
    </div>
  );
}

export default CustomerDashboard;