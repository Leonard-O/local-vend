import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { Rating } from '@/types';

interface EnhancedRatingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUserId: string;
  targetUserName: string;
  roleType: 'vendor' | 'rider' | 'customer';
  orderId: string;
  onSubmit: (rating: number, feedback: string) => void;
}

export default function EnhancedRatingDialog({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  roleType,
  orderId,
  onSubmit
}: EnhancedRatingDialogProps) {
  const { ratings } = useData();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Find existing rating for this specific user on this order
  const existingRating = ratings.find(
    r => r.orderId === orderId && r.toUserId === targetUserId
  );

  // Reset form when dialog opens or when targetUserId changes
  useEffect(() => {
    if (open) {
      if (existingRating) {
        setRating(existingRating.rating);
        setFeedback(existingRating.feedback || '');
      } else {
        setRating(0);
        setFeedback('');
      }
      setHoveredRating(0);
    }
  }, [open, targetUserId, existingRating]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    onSubmit(rating, feedback);
    setIsSubmitting(false);
    onOpenChange(false);
  };

  const canEdit = existingRating 
    ? new Date().getTime() - new Date(existingRating.createdAt).getTime() < 24 * 60 * 60 * 1000
    : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {existingRating ? 'Edit Rating' : 'Rate'} {targetUserName}
          </DialogTitle>
          <DialogDescription>
            How was your experience with this {roleType}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => canEdit && setRating(star)}
                onMouseEnter={() => canEdit && setHoveredRating(star)}
                onMouseLeave={() => canEdit && setHoveredRating(0)}
                disabled={!canEdit}
                className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent'}
            </div>
          )}

          <div className="space-y-2">
            <Textarea
              placeholder="Share your experience (optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={!canEdit}
              rows={4}
              className="resize-none"
            />
          </div>

          {!canEdit && (
            <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Ratings can only be edited within 24 hours of submission.
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={rating === 0 || isSubmitting || !canEdit}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : existingRating ? 'Update Rating' : 'Submit Rating'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}