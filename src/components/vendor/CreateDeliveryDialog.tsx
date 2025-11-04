import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { calculatePaymentDistribution } from '@/lib/mockData';
import type { Delivery, Product, Payment } from '@/types';

interface CreateDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateDeliveryDialog({ open, onOpenChange }: CreateDeliveryDialogProps) {
  const { user } = useAuth();
  const { products, riders, addDelivery, addPayment, updateRider } = useData();
  const { toast } = useToast();
  const [selectedProducts, setSelectedProducts] = useState<Array<{ product: Product; quantity: number }>>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [notes, setNotes] = useState('');

  const handleProductToggle = (product: Product, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    } else {
      setSelectedProducts(selectedProducts.filter(p => p.product.id !== product.id));
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map(p =>
        p.product.id === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    );
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProducts.length) {
      toast({
        title: 'Error',
        description: 'Please add at least one product',
        variant: 'destructive',
      });
      return;
    }

    // Generate 4-digit delivery code
    const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

    const newDelivery: Delivery = {
      id: `DEL${Date.now()}`,
      vendorId: user?.id || '',
      vendorName: user?.name || '',
      riderId: selectedRiderId || undefined,
      riderName: selectedRiderId ? riders.find(r => r.id === selectedRiderId)?.name : undefined,
      customerName,
      customerPhone,
      customerAddress,
      products: selectedProducts,
      totalAmount: calculateTotal(),
      status: selectedRiderId ? 'assigned' : 'pending',
      deliveryCode,
      pickupConfirmed: false,
      deliveryConfirmed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      notes: notes || undefined,
    };

    addDelivery(newDelivery);

    // Create payment record
    const paymentDistribution = calculatePaymentDistribution(calculateTotal());
    const newPayment: Payment = {
      id: `PAY${Date.now()}`,
      orderId: newDelivery.id,
      customerId: '', // Would be set when customer places order
      vendorId: user?.id || '',
      riderId: selectedRiderId,
      totalAmount: calculateTotal(),
      vendorShare: paymentDistribution.vendorShare,
      riderShare: paymentDistribution.riderShare,
      platformFee: paymentDistribution.platformFee,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    addPayment(newPayment);

    // Update rider status if assigned
    if (selectedRiderId) {
      const rider = riders.find(r => r.id === selectedRiderId);
      if (rider) {
        updateRider({
          ...rider,
          status: 'busy',
          activeDeliveries: rider.activeDeliveries + 1,
        });
      }

      toast({
        title: 'Delivery Created',
        description: `Delivery assigned to ${rider?.name}. Customer will be notified via SMS.`,
      });
    } else {
      toast({
        title: 'Delivery Created',
        description: 'Delivery saved. Assign a rider to proceed.',
      });
    }

    // Reset form
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setSelectedProducts([]);
    setSelectedRiderId('');
    setNotes('');
    onOpenChange(false);
  };

  const availableRiders = riders.filter(r => r.status === 'available');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Delivery</DialogTitle>
            <DialogDescription>
              Fill in the delivery details and assign a rider
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Customer Information</h3>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerAddress">Delivery Address *</Label>
                <Textarea
                  id="customerAddress"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="123 Main St, City, State"
                  rows={2}
                  required
                />
              </div>
            </div>

            <Separator />

            {/* Product Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Select Products *</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto border rounded-lg p-3">
                {products.map((product) => {
                  const selected = selectedProducts.find(p => p.product.id === product.id);
                  return (
                    <div key={product.id} className="flex items-start gap-3 p-2 rounded hover:bg-muted/50">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={!!selected}
                        onCheckedChange={(checked) => handleProductToggle(product, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <Label htmlFor={`product-${product.id}`} className="font-medium cursor-pointer">
                          {product.name}
                        </Label>
                        <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                      </div>
                      {selected && (
                        <Input
                          type="number"
                          min="1"
                          value={selected.quantity}
                          onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value))}
                          className="w-20 h-8"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedProducts.length > 0 && (
                <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Rider Assignment */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Assign Rider (Optional)</h3>
              <div className="space-y-2">
                <Label htmlFor="rider">Select Rider</Label>
                <Select value={selectedRiderId} onValueChange={setSelectedRiderId}>
                  <SelectTrigger id="rider">
                    <SelectValue placeholder="Leave unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Leave unassigned</SelectItem>
                    {availableRiders.map((rider) => (
                      <SelectItem key={rider.id} value={rider.id}>
                        <div className="flex items-center gap-2">
                          <span>{rider.name}</span>
                          <Badge variant="outline" className="text-xs">Available</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Delivery Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special instructions for the rider..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={selectedProducts.length === 0}>
              Create Delivery
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}