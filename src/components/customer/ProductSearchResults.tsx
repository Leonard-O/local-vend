import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Star, ShoppingCart, Package } from 'lucide-react';
import { VendorWithDistance, Order } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { calculateETA, generateDeliveryCode } from '@/lib/mockData';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';

interface ProductSearchResultsProps {
  results: VendorWithDistance[];
  searchQuery: string;
}

export default function ProductSearchResults({ results, searchQuery }: ProductSearchResultsProps) {
  const { addOrder } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  // Filter products based on search query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return results;
    
    return results.map(vendor => ({
      ...vendor,
      products: vendor.products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })).filter(vendor => vendor.products.length > 0);
  }, [results, searchQuery]);

  const [selectedVendor, setSelectedVendor] = useState<VendorWithDistance | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);

  // Reset selected products when vendor changes
  useEffect(() => {
    if (!isOrderDialogOpen) {
      setSelectedProducts(new Map());
    }
  }, [isOrderDialogOpen]);

  const handlePlaceOrder = () => {
    if (!selectedVendor) return;

    const orderProducts = Array.from(selectedProducts.entries())
      .map(([productId, quantity]) => {
        const product = selectedVendor.products.find(p => p.id === productId);
        if (!product) return null;
        return {
          productId: product.id,
          productName: product.name,
          quantity,
          price: product.price
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (orderProducts.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to cart before placing order",
        variant: "destructive"
      });
      return;
    }

    const totalAmount = orderProducts.reduce((sum, p) => sum + (p.price * p.quantity), 0);

    const newOrder = {
      id: `order_${Date.now()}`,
      customerId: user?.id || '',
      customerName: user?.name || '',
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.businessName,
      products: orderProducts,
      totalAmount,
      status: 'pending' as const,
      deliveryCode: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vendorLocationLat: selectedVendor.locationLat,
      vendorLocationLng: selectedVendor.locationLng,
      distanceKm: selectedVendor.distance,
      etaMinutes: selectedVendor.distance ? Math.ceil(selectedVendor.distance * 3) : 20,
    };

    addOrder(newOrder);

    // Close dialog and reset
    setIsOrderDialogOpen(false);
    setSelectedProducts(new Map());

    toast({
      title: "Order Placed Successfully!",
      description: `Your order from ${selectedVendor.businessName} has been placed. Total: KES ${totalAmount.toFixed(2)}`,
    });
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newMap = new Map(selectedProducts);
    if (quantity > 0) {
      newMap.set(productId, quantity);
    } else {
      newMap.delete(productId);
    }
    setSelectedProducts(newMap);
  };

  const calculateTotal = () => {
    if (!selectedVendor) return 0;
    return Array.from(selectedProducts.entries()).reduce((sum, [productId, quantity]) => {
      const product = selectedVendor.products.find(p => p.id === productId);
      return sum + (product ? product.price * quantity : 0);
    }, 0);
  };

  if (!searchQuery.trim()) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">Start Searching</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Enter a product name to find vendors near you
          </p>
        </div>
      </Card>
    );
  }

  if (filteredResults.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No Results Found</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            No vendors found with "{searchQuery}". Try a different search term.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {filteredResults.map((vendor) => {
        if (!vendor || !vendor.products) return null;
        
        return (
          <Card key={vendor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{vendor.businessName}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{vendor.distance ? vendor.distance.toFixed(1) : '0.0'} km away</span>
                    </div>
                    {vendor.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{vendor.rating.toFixed(1)}/5</span>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setSelectedProducts(new Map());
                    setIsOrderDialogOpen(true);
                  }}
                  className="gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Order
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Available Products:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vendor.products.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">KES {product.price.toFixed(2)}</p>
                      </div>
                      <Badge variant={product.stock > 10 ? 'default' : 'secondary'}>
                        {product.stock} in stock
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Order Dialog */}
      <Dialog open={isOrderDialogOpen} onOpenChange={(open) => {
        setIsOrderDialogOpen(open);
        if (!open) {
          setSelectedVendor(null);
          setSelectedProducts(new Map());
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Place Order from {selectedVendor?.businessName}</DialogTitle>
            <DialogDescription>
              Select products and quantities for your order
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedVendor?.products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                {product.imageUrl && (
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-muted-foreground">KES {product.price.toFixed(2)}</p>
                  <Badge variant="outline" className="mt-1">{product.stock} available</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`qty-${product.id}`} className="sr-only">Quantity</Label>
                  <Input
                    id={`qty-${product.id}`}
                    type="number"
                    min="0"
                    max={product.stock}
                    value={selectedProducts.get(product.id) || 0}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                </div>
              </div>
            ))}

            {selectedProducts.size > 0 && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Distance:</span>
                  <span className="font-medium">{selectedVendor?.distance ? selectedVendor.distance.toFixed(1) : '0.0'} km</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Delivery:</span>
                  <span className="font-medium">{calculateETA(selectedVendor?.distance || 0)} min</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total:</span>
                  <span>KES {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePlaceOrder} disabled={selectedProducts.size === 0}>
              Place Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}