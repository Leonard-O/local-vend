import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Product } from '@/types';
import { ShoppingCart, Package, Star } from 'lucide-react';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';
import { useState } from 'react';

interface ProductDetailsDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (product: Product, quantity: number) => void;
  vendorName?: string;
  vendorRating?: number;
}

export function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
  onAddToCart,
  vendorName,
  vendorRating
}: ProductDetailsDialogProps) {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const handleAddToCart = () => {
    onAddToCart(product, quantity);
    onOpenChange(false);
    setQuantity(1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{product.category}</Badge>
              {product.unit_type && (
                <Badge variant="secondary">
                  {formatUnitLabel(product.unit_type, product.unit_value, product.unit_label)}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Image */}
          {product.image_url && (
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted border">
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Vendor Info */}
          {vendorName && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Sold by</p>
                <p className="font-semibold">{vendorName}</p>
              </div>
              {vendorRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{vendorRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          {/* Price & Stock */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-3xl font-bold text-primary">
                KES {product.price.toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Stock</p>
                <p className="font-semibold">
                  {product.stock_quantity > 0 ? (
                    <span className="text-green-600">{product.stock_quantity} available</span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {product.description || 'No description available.'}
            </p>
          </div>

          {/* Quantity Selector & Add to Cart */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center gap-2 border rounded-lg">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="h-10 px-3"
                >
                  -
                </Button>
                <Input
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                  className="w-16 text-center border-0 focus-visible:ring-0"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  disabled={quantity >= product.stock_quantity}
                  className="h-10 px-3"
                >
                  +
                </Button>
              </div>
            </div>
            <Button
              onClick={handleAddToCart}
              disabled={product.stock_quantity === 0}
              className="flex-1 gap-2 h-12 text-base font-semibold"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5" />
              Add to Cart - KES {(product.price * quantity).toFixed(2)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}