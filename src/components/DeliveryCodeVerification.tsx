import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { QrCode, CheckCircle, XCircle } from 'lucide-react';
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
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = () => {
    setVerifying(true);
    setError('');

    // Simulate verification delay
    setTimeout(() => {
      // Strict comparison - must match exactly
      if (code.trim() === order.deliveryCode?.trim()) {
        onVerify(true);
        setCode('');
        onOpenChange(false);
      } else {
        setError('Invalid code. Please try again.');
        onVerify(false);
      }
      setVerifying(false);
    }, 500);
  };

  const handleScanQR = () => {
    // Placeholder for QR scanning functionality
    alert('QR Scanner would open here. For demo, use code: ' + order.deliveryCode);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>
            {verificationType === 'pickup' ? 'Confirm Pickup' : 'Confirm Delivery'}
          </DialogTitle>
          <DialogDescription>
            {verificationType === 'pickup' 
              ? 'Enter the vendor\'s verification code or scan the QR code on the package.'
              : 'Enter the customer\'s verification code or scan their QR code.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="Enter 5-digit code"
              value={code}
              onChange={(e) => {
                // Only allow numbers and limit to delivery code length
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= (order.deliveryCode?.length || 5)) {
                  setCode(value);
                }
              }}
              className="text-center text-2xl tracking-widest"
            />
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <XCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerify}
              disabled={code.length !== (order.deliveryCode?.length || 5) || verifying}
              className="flex-1"
            >
              {verifying ? (
                'Verifying...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Verify Code
                </>
              )}
            </Button>
            <Button
              onClick={handleScanQR}
              variant="outline"
              className="flex-1"
            >
              <QrCode className="w-4 h-4 mr-2" />
              Scan QR
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Order ID: {order.id}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}