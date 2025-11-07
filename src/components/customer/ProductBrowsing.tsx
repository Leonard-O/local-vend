import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Product } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Search, Filter, Eye } from 'lucide-react';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ProductDetailsDialog } from './ProductDetailsDialog';

interface ProductBrowsingProps {
  onAddToCart: (product: Product, quantity: number) => void;
}

export function ProductBrowsing({ onAddToCart }: ProductBrowsingProps) {
  const { products, vendors } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUnitType, setSelectedUnitType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  const unitTypes = ['all', ...Array.from(new Set(products.filter(p => p.unit_type).map(p => p.unit_type!)))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesUnit = selectedUnitType === 'all' || product.unit_type === selectedUnitType;
    
    return matchesSearch && matchesCategory && matchesUnit && product.stock_quantity > 0;
  });

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id] || 1;
    onAddToCart(product, quantity);
    setQuantities({ ...quantities, [product.id]: 1 });
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setDetailsDialogOpen(true);
  };

  const getVendorInfo = (vendorId: string) => {
    return vendors.find(v => v.id === vendorId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="space-y-4 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="unit-filter">Unit Type</Label>
                <Select value={selectedUnitType} onValueChange={setSelectedUnitType}>
                  <SelectTrigger id="unit-filter">
                    <SelectValue placeholder="All units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {unitTypes.filter(u => u !== 'all').map(unit => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(selectedCategory !== 'all' || selectedUnitType !== 'all') && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedUnitType('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {product.image_url && (
              <div 
                className="w-full h-48 cursor-pointer overflow-hidden"
                onClick={() => handleViewDetails(product)}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {product.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-primary">
                    KES {product.price.toFixed(2)}
                  </span>
                  {product.unit_type && (
                    <Badge variant="secondary" className="text-xs">
                      {formatUnitLabel(product.unit_type, product.unit_value, product.unit_label)}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{product.category}</Badge>
                  {product.stock_quantity > 0 ? (
                    <span className="text-green-600">In Stock</span>
                  ) : (
                    <span className="text-red-600">Out of Stock</span>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <div className="flex gap-2 w-full">
                <Input
                  type="number"
                  min="1"
                  max={product.stock_quantity}
                  value={quantities[product.id] || 1}
                  onChange={(e) => setQuantities({
                    ...quantities,
                    [product.id]: parseInt(e.target.value) || 1
                  })}
                  className="w-20"
                />
                <Button
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock_quantity === 0}
                  className="flex-1 gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => handleViewDetails(product)}
                className="w-full gap-2"
              >
                <Eye className="h-4 w-4" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found matching your criteria.</p>
        </div>
      )}

      <ProductDetailsDialog
        product={selectedProduct}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onAddToCart={onAddToCart}
        vendorName={selectedProduct ? getVendorInfo(selectedProduct.vendor_id)?.name : undefined}
        vendorRating={selectedProduct ? getVendorInfo(selectedProduct.vendor_id)?.rating : undefined}
      />
    </div>
  );
}