import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { getUnitsForCategory, UNIT_LABELS } from '@/lib/categoryUnitMapping';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSave: (product: Partial<Product>) => void;
}

export function ProductDialog({ open, onOpenChange, product, onSave }: ProductDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    stock_quantity: 0,
    image_url: '',
    unit_type: null,
    unit_value: null,
    unit_label: '',
    quantity_per_unit: null,
  });
  const [showCustomUnit, setShowCustomUnit] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
      // Check if product has a custom unit not in the standard list
      if (product.unit_type && product.category) {
        const allowedUnits = getUnitsForCategory(product.category);
        setShowCustomUnit(!allowedUnits.includes(product.unit_type));
      }
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        stock_quantity: 0,
        image_url: '',
        unit_type: null,
        unit_value: null,
        unit_label: '',
        quantity_per_unit: null,
      });
      setShowCustomUnit(false);
    }
  }, [product, open]);

  const handleCategoryChange = (category: string) => {
    // Reset unit fields when category changes
    setFormData({
      ...formData,
      category,
      unit_type: null,
      unit_value: null,
      unit_label: '',
      quantity_per_unit: null,
    });
    setShowCustomUnit(false);
  };

  const handleUnitTypeChange = (value: string) => {
    if (value === 'custom') {
      setShowCustomUnit(true);
      setFormData({ ...formData, unit_type: '' });
    } else if (value === 'none') {
      setShowCustomUnit(false);
      setFormData({ 
        ...formData, 
        unit_type: null,
        unit_value: null,
        unit_label: '',
        quantity_per_unit: null,
      });
    } else {
      setShowCustomUnit(false);
      setFormData({ ...formData, unit_type: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Trim strings and validate
    const name = formData.name?.trim();
    const category = formData.category?.trim();
    const price = formData.price;
    
    if (!name || !category || price === undefined || price === null || price < 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Category, and Price)',
        variant: 'destructive',
      });
      return;
    }

    // Auto-generate unit_label if not provided but unit_type and unit_value exist
    let finalFormData = { ...formData };
    if (formData.unit_type && formData.unit_value && !formData.unit_label) {
      finalFormData.unit_label = `${formData.unit_value} ${formData.unit_type}`;
    }

    // Include vendor_id for new products
    if (!product && user?.id) {
      finalFormData.vendor_id = user.id;
    }

    onSave(finalFormData);
  };

  // Get allowed units for the selected category
  const allowedUnits = formData.category ? getUnitsForCategory(formData.category) : [];
  const showUnitFields = formData.category && allowedUnits.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the product details below.' : 'Fill in the details to add a new product to your inventory.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vegetables">Vegetables</SelectItem>
                <SelectItem value="Fruits">Fruits</SelectItem>
                <SelectItem value="Dairy">Dairy</SelectItem>
                <SelectItem value="Meat">Meat</SelectItem>
                <SelectItem value="Bakery">Bakery</SelectItem>
                <SelectItem value="Beverages">Beverages</SelectItem>
                <SelectItem value="Groceries">Groceries</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Appliances">Appliances</SelectItem>
                <SelectItem value="Clothing">Clothing</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (KES) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          {showUnitFields && (
            <div className="border-t pt-4 mt-4">
              <h3 className="text-sm font-semibold mb-3">Unit Measurement (Optional)</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Define how this product is measured or sold
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="unit_type">Unit Type</Label>
                  {showCustomUnit ? (
                    <div className="space-y-2">
                      <Input
                        id="unit_type"
                        placeholder="e.g., dozen, tray, sack"
                        value={formData.unit_type || ''}
                        onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCustomUnit(false);
                          setFormData({ ...formData, unit_type: null });
                        }}
                      >
                        ← Back to standard units
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={formData.unit_type || 'none'}
                      onValueChange={handleUnitTypeChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No unit</SelectItem>
                        {allowedUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {UNIT_LABELS[unit] || unit}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">Custom unit...</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label htmlFor="unit_value">Unit Value</Label>
                  <Input
                    id="unit_value"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g., 1, 500, 2.5"
                    value={formData.unit_value || ''}
                    onChange={(e) => setFormData({ ...formData, unit_value: e.target.value ? parseFloat(e.target.value) : null })}
                    disabled={!formData.unit_type}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="unit_label">Display Label</Label>
                  <Input
                    id="unit_label"
                    placeholder="e.g., '1 kg', 'per bunch'"
                    value={formData.unit_label || ''}
                    onChange={(e) => setFormData({ ...formData, unit_label: e.target.value || null })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Auto-generated if left empty
                  </p>
                </div>

                <div>
                  <Label htmlFor="quantity_per_unit">Quantity per Unit</Label>
                  <Input
                    id="quantity_per_unit"
                    type="number"
                    min="1"
                    placeholder="e.g., 6 (items in pack)"
                    value={formData.quantity_per_unit || ''}
                    onChange={(e) => setFormData({ ...formData, quantity_per_unit: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}