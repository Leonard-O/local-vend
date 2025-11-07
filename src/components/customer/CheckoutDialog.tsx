import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/types';
import { ShoppingCart, Package, Loader2, CheckCircle } from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItem[];
  onCheckout: () => Promise<void>;
}

export function CheckoutDialog({ open, onOpenChange, cart, onCheckout }: CheckoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Group cart items by vendor
  const itemsByVendor = cart.reduce((acc, item) => {
    const vendorId = item.product.vendor_id;
    if (!acc[vendorId]) {
      acc[vendorId] = [];
    }
    acc[vendorId].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const deliveryFee = Object.keys(itemsByVendor).length * 50; // KES 50 per vendor
  const total = subtotal + deliveryFee;

  const handleConfirmCheckout = async () => {
    setIsProcessing(true);
    try {
      await onCheckout();
      onOpenChange(false);
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Review Your Order
          </DialogTitle>
          <DialogDescription>
            Please review your order details before confirming
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Items by Vendor */}
          {Object.entries(itemsByVendor).map(([vendorId, items]) => {
            const vendorName = items[0].product.vendor_id; // You might want to get actual vendor name
            const vendorTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

            return (
              <Card key={vendorId}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-semibold">Vendor Order</h3>
                      </div>
                      <Badge variant="outline">KES {vendorTotal.toFixed(2)}</Badge>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      {items.map((item) => (
                        <div key={item.product.id} className="flex justify-between items-start">
                          <div className="flex gap-3 flex-1">
                            {item.product.image_url && (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.product.category}
                              </p>
                              <p className="text-sm">
                                <span className="font-semibold">Qty:</span> {item.quantity}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              KES {(item.product.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              @ KES {item.product.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Order Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                
                <div className="flex justify-between text-base">
                  <span>Subtotal ({cart.length} items)</span>
                  <span className="font-medium">KES {subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-base">
                  <span>Delivery Fee ({Object.keys(itemsByVendor).length} vendor{Object.keys(itemsByVendor).length > 1 ? 's' : ''})</span>
                  <span className="font-medium">KES {deliveryFee.toFixed(2)}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-primary">KES {total.toFixed(2)}</span>
                </div>

                <div className="pt-4 space-y-2">
                  <Button
                    onClick={handleConfirmCheckout}
                    disabled={isProcessing}
                    className="w-full h-12 text-base font-semibold"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirm & Place Order
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  By placing this order, you agree to our terms and conditions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
