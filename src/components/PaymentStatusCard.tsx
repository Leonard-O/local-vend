import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Payment } from '@/types';
import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface PaymentStatusCardProps {
  payment: Payment;
}

export default function PaymentStatusCard({ payment }: PaymentStatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'held':
        return 'bg-blue-100 text-blue-800';
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'held':
        return <DollarSign className="w-4 h-4" />;
      case 'released':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Payment Status</CardTitle>
          <Badge className={getStatusColor(payment.status)}>
            <span className="flex items-center gap-1">
              {getStatusIcon(payment.status)}
              {payment.status.toUpperCase()}
            </span>
          </Badge>
        </div>
        <CardDescription>Order #{payment.order_id}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">KES {payment.total_amount.toFixed(2)}</p>
          </div>
          {payment.mpesa_transaction_id && (
            <div>
              <p className="text-sm text-muted-foreground">M-Pesa ID</p>
              <p className="text-sm font-mono">{payment.mpesa_transaction_id}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vendor Share</span>
            <span className="font-medium">KES {payment.vendor_share.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rider Fee</span>
            <span className="font-medium">KES {payment.rider_share.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Platform Fee</span>
            <span className="font-medium">KES {payment.platform_fee.toFixed(2)}</span>
          </div>
        </div>

        {payment.status === 'held' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            Payment is held in escrow. It will be released once the customer confirms delivery.
          </div>
        )}

        {payment.status === 'released' && payment.released_at && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
            Payment released on {new Date(payment.released_at).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}