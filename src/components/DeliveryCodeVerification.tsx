import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Package } from 'lucide-react';
import { Order } from '@/types';

interface DeliveryCodeVerificationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order;
  verificationType: 'pickup' | 'delivery';
  onVerify: (success: boolean) => void;
}

export default function DeliveryCodeVerification({
  open,
  onOpenChange,
  order,
  verificationType,
  onVerify
}: DeliveryCodeVerificationProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    setError('');
    
    if (verificationType === 'pickup') {
      // Verify pickup code
      if (code === order.pickup_code) {
        onVerify(true);
        onOpenChange(false);
        setCode('');
      } else {
        setError('Invalid pickup code. Please confirm with the vendor.');
      }
    } else {
      // Verify delivery code
      if (code === order.delivery_code) {
        onVerify(true);
        onOpenChange(false);
        setCode('');
      } else {
        setError('Invalid delivery code. Please ask the customer for the correct code.');
      }
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onOpenChange(false);
  };

  const expectedCodeLength = verificationType === 'pickup' 
    ? (order.pickup_code?.length || 6) 
    : (order.delivery_code?.length || 5);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {verificationType === 'pickup' ? (
              <>
                <Package className="w-5 h-5" />
                Confirm Pickup from Vendor
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Delivery to Customer
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {verificationType === 'pickup' 
              ? 'Enter the pickup code provided by the vendor to confirm you have collected the package.'
              : 'Enter the delivery code provided by the customer to confirm successful delivery.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder={`Enter ${expectedCodeLength}-digit code`}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              className="text-center text-2xl tracking-widest font-mono"
              maxLength={expectedCodeLength}
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <Button
            onClick={handleVerify}
            disabled={code.length < 3}
            className="w-full"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Verify Code
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Order ID: #{order.id.slice(-6)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}