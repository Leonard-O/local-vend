import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

interface RatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toUserId: string;
  toUserName: string;
  roleType: 'vendor' | 'rider' | 'customer';
  orderId?: string;
}

export default function RatingDialog({
  open,
  onOpenChange,
  toUserId,
  toUserName,
  roleType,
  orderId
}: RatingDialogProps) {
  const { user } = useAuth();
  const { addRating } = useData();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when dialog opens or toUserId changes
  useEffect(() => {
    if (open) {
      setRating(0);
      setFeedback('');
      setHoveredRating(0);
    }
  }, [open, toUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Rating Required',
        description: 'Please select a star rating',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const newRating = {
        id: `RAT${Date.now()}`,
        fromUserId: user?.id || '',
        fromUserName: user?.name || '',
        toUserId,
        toUserName,
        roleType,
        rating,
        feedback: feedback.trim() || undefined,
        orderId,
        createdAt: new Date().toISOString()
      };

      addRating(newRating);

      toast({
        title: 'Rating Submitted',
        description: `Thank you for rating ${toUserName}!`
      });

      // Reset form
      setRating(0);
      setFeedback('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleLabel = () => {
    switch (roleType) {
      case 'vendor': return 'Vendor';
      case 'rider': return 'Rider';
      case 'customer': return 'Customer';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rate {getRoleLabel()}</DialogTitle>
            <DialogDescription>
              Share your experience with {toUserName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <Label className="text-base">Your Rating *</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-3 text-lg font-semibold">
                    {rating} / 5
                  </span>
                )}
              </div>
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback (Optional)</Label>
              <Textarea
                id="feedback"
                placeholder={`Share your experience with ${toUserName}...`}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {feedback.length} / 500
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || rating === 0}>
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}