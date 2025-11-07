import { useState, useMemo } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import DeliveryCodeVerification from '@/components/DeliveryCodeVerification';
import EnhancedRatingDialog from '@/components/EnhancedRatingDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, ShoppingBag, MapPin, Star, Clock, Package, CheckCircle, ShoppingCart } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { VendorWithDistance, Product } from '@/types';
import ProductSearchResults from '@/components/customer/ProductSearchResults';
import OrderTracking from '@/components/customer/OrderTracking';
import { ProductBrowsing } from '@/components/customer/ProductBrowsing';
import { CheckoutDialog } from '@/components/customer/CheckoutDialog';
import { supabase } from '@/lib/supabaseClient';

interface CartItem {
  product: Product;
  quantity: number;
}

function CustomerDashboard() {
  const { products, vendors, orders, updateOrder, addRating, payments, addOrder, addPayment, updateProduct } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // State declarations
  const [activeTab, setActiveTab] = useState('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<VendorWithDistance[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutDialogOpen, setCheckoutDialogOpen] = useState(false);
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

  const userOrders = orders.filter(order => order.customer_id === user?.id);

  // Cart functions
  const handleAddToCart = (product: Product, quantity: number) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { product, quantity }];
    });

    toast({
      title: 'Added to Cart',
      description: `${product.name} (${quantity}x) added to your cart`,
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const cartItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Checkout function
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Cart is empty',
        description: 'Please add items to your cart before checkout',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to place an order',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Group cart items by vendor
      const itemsByVendor = cart.reduce((acc, item) => {
        const vendorId = item.product.vendor_id;
        if (!acc[vendorId]) {
          acc[vendorId] = [];
        }
        acc[vendorId].push(item);
        return acc;
      }, {} as Record<string, CartItem[]>);

      // Create an order for each vendor
      for (const [vendorId, items] of Object.entries(itemsByVendor)) {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) continue;

        const orderProducts = items.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          unit_type: item.product.unit_type || null,
          unit_value: item.product.unit_value || null,
          unit_label: item.product.unit_label || null,
        }));

        const orderTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const deliveryFee = 50; // KES 50 delivery fee
        const totalAmount = orderTotal + deliveryFee;

        // Generate delivery code
        const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

        // Create order without ID - let Supabase generate UUID
        const newOrder = {
          customer_id: user.id,
          customer_name: user.name,
          vendor_id: vendorId,
          vendor_name: vendor.name,
          rider_id: null,
          rider_name: null,
          products: orderProducts,
          total_amount: totalAmount,
          status: 'pending' as const,
          delivery_code: deliveryCode,
          pickup_confirmed: false,
          delivery_confirmed: false,
          customer_location_lat: null,
          customer_location_lng: null,
          vendor_location_lat: vendor.location_lat || null,
          vendor_location_lng: vendor.location_lng || null,
          distance_km: null,
          eta_minutes: null,
          pickup_time: null,
          delivery_time: null,
          notes: ''
        };

        // Insert order and get the generated UUID
        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([newOrder])
          .select()
          .single();

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw orderError;
        }

        // Create payment record
        const vendorShare = orderTotal * 0.85; // 85% to vendor
        const riderShare = deliveryFee; // Delivery fee to rider
        const platformFee = orderTotal * 0.15; // 15% platform fee

        const payment = {
          order_id: insertedOrder.id,
          customer_id: user.id,
          vendor_id: vendorId,
          rider_id: null,
          total_amount: totalAmount,
          vendor_share: vendorShare,
          rider_share: riderShare,
          platform_fee: platformFee,
          status: 'held' as const
        };

        const { error: paymentError } = await supabase
          .from('payments')
          .insert([payment]);

        if (paymentError) {
          console.error('Payment creation error:', paymentError);
        }

        // Update product stock
        for (const item of items) {
          const product = products.find(p => p.id === item.product.id);
          if (product && product.stock_quantity >= item.quantity) {
            const { error: stockError } = await supabase
              .from('products')
              .update({ stock_quantity: product.stock_quantity - item.quantity })
              .eq('id', item.product.id);

            if (stockError) {
              console.error('Stock update error:', stockError);
            }
          }
        }
      }

      // Clear cart after successful checkout
      setCart([]);
      
      toast({
        title: '✅ Order Placed Successfully!',
        description: `Your order has been placed. Waiting for vendor confirmation.`,
        duration: 5000,
      });

      // Switch to orders tab
      setActiveTab('orders');
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: '⚠️ Checkout Failed',
        description: 'There was an error processing your order. Please try again.',
        variant: 'destructive'
      });
    }
  };

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

    const vendorIds = [...new Set(matchingProducts.map(p => p.vendor_id))];

    const results: VendorWithDistance[] = vendorIds
      .map(vendorId => {
        const vendor = vendors.find(v => v.id === vendorId);
        if (!vendor) return null;

        const vendorProducts = matchingProducts.filter(p => p.vendor_id === vendorId);
        
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
      
      {/* Cart Badge */}
      {cartItemCount > 0 && (
        <div className="fixed top-20 right-4 z-50">
          <Button
            size="lg"
            className="rounded-full shadow-lg gap-2"
            onClick={() => setActiveTab('cart')}
          >
            <ShoppingCart className="w-5 h-5" />
            <Badge variant="secondary" className="ml-1">
              {cartItemCount}
            </Badge>
            <span className="ml-2">KES {cartTotal.toFixed(2)}</span>
          </Button>
        </div>
      )}

      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 h-auto">
            <TabsTrigger value="browse" className="gap-2 py-3">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="cart" className="gap-2 py-3">
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {cartItemCount > 0 && (
                <Badge variant="secondary" className="ml-1">{cartItemCount}</Badge>
              )}
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

          <TabsContent value="browse" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Discover Products</h2>
              <p className="text-muted-foreground">
                Browse products from local vendors near you
              </p>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Search for products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={handleSearch} className="gap-2">
                    <Search className="w-4 h-4" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Search Results for "{searchQuery}"</h3>
                <ProductSearchResults results={searchResults} searchQuery={searchQuery} />
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            {/* Product Browsing Component */}
            <ProductBrowsing onAddToCart={handleAddToCart} />
          </TabsContent>

          <TabsContent value="cart" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Shopping Cart</h2>
              <p className="text-muted-foreground">
                Review your items before checkout
              </p>
            </div>

            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map((item) => (
                  <Card key={item.product.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {item.product.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-24 h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">{item.product.description}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-lg font-bold">KES {item.product.price.toFixed(2)}</span>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    setCart(cart.map(i =>
                                      i.product.id === item.product.id
                                        ? { ...i, quantity: i.quantity - 1 }
                                        : i
                                    ));
                                  }
                                }}
                              >
                                -
                              </Button>
                              <span className="w-12 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setCart(cart.map(i =>
                                    i.product.id === item.product.id
                                      ? { ...i, quantity: i.quantity + 1 }
                                      : i
                                  ));
                                }}
                              >
                                +
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setCart(cart.filter(i => i.product.id !== item.product.id));
                                toast({
                                  title: 'Removed from cart',
                                  description: `${item.product.name} removed from your cart`,
                                });
                              }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold">
                            KES {(item.product.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <div className="flex justify-between text-lg">
                        <span>Subtotal:</span>
                        <span className="font-semibold">KES {cartTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-2xl font-bold border-t pt-2">
                        <span>Total:</span>
                        <span>KES {cartTotal.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button 
                      className="w-full mt-4" 
                      size="lg"
                      onClick={() => setCheckoutDialogOpen(true)}
                    >
                      Proceed to Checkout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Start browsing products to add items to your cart
                    </p>
                  </div>
                  <Button onClick={() => setActiveTab('browse')}>
                    Browse Products
                  </Button>
                </div>
              </Card>
            )}
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
                  const orderPayment = payments.find(p => p.order_id === order.id);
                  
                  return (
                    <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Package className="w-5 h-5 text-primary" />
                              <CardTitle className="text-xl">Order #{order.id.slice(-8)}</CardTitle>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{order.vendor_name}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                <span>{new Date(order.created_at).toLocaleDateString('en-US', { 
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
                                    <span className="font-medium">{product?.product_name || 'Unknown Product'}</span>
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
                            KES {(Number(order.total_amount) || 0).toFixed(2)}
                          </span>
                        </div>

                        {order.delivery_code && (
                          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
                            <div className="text-center space-y-3">
                              <p className="text-sm font-semibold uppercase tracking-wider opacity-90">
                                Your Delivery Code
                              </p>
                              <div className="bg-white/20 backdrop-blur-sm rounded-lg py-4 px-6">
                                <p className="text-5xl font-black tracking-[0.3em] font-mono">
                                  {order.delivery_code}
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
                                <span className="font-semibold text-foreground">{orderPayment.order_id.slice(-8)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Total Amount</span>
                                <span className="font-bold text-foreground">KES {(Number(orderPayment.total_amount) || 0).toFixed(2)}</span>
                              </div>
                              <div className="h-px bg-border my-2"></div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Vendor Share</span>
                                <span className="font-semibold text-green-600 dark:text-green-400">
                                  KES {(Number(orderPayment.vendor_share) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Rider Fee</span>
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  KES {(Number(orderPayment.rider_share) || 0).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground font-medium">Platform Fee</span>
                                <span className="font-semibold text-purple-600 dark:text-purple-400">
                                  KES {(Number(orderPayment.platform_fee) || 0).toFixed(2)}
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
                          {order.status === 'in_transit' && !order.delivery_confirmed && (
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
                                  toUserId: order.rider_id || '',
                                  toUserName: order.rider_name || '',
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
                                  toUserId: order.vendor_id,
                                  toUserName: order.vendor_name,
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

      <CheckoutDialog
        open={checkoutDialogOpen}
        onOpenChange={setCheckoutDialogOpen}
        cart={cart}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

export default CustomerDashboard;