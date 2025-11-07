import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Edit, Trash2 } from 'lucide-react';
import { Product } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDialog } from './ProductDialog';
import { formatUnitLabel } from '@/lib/categoryUnitMapping';

export default function ProductManagement() {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  // Filter products to show only the current vendor's products
  const vendorProducts = products.filter(p => p.vendor_id === user?.id);

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
    }
  };

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (editingProduct) {
      // Update existing product
      updateProduct(editingProduct.id, productData);
    } else {
      // Add new product with vendor_id
      addProduct({
        ...productData,
        vendor_id: user!.id,
      });
    }
    setIsDialogOpen(false);
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', variant: 'destructive' as const };
    if (stock < 10) return { label: 'Low Stock', variant: 'secondary' as const };
    return { label: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Products</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your product inventory and availability
          </p>
        </div>
        <Button onClick={handleAddProduct} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {vendorProducts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No products yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Start by adding your first product to your inventory
            </p>
            <Button onClick={handleAddProduct} className="gap-2 mt-4">
              <Plus className="w-4 h-4" />
              Add Your First Product
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vendorProducts.map((product) => {
            const stockStatus = getStockStatus(product.stock_quantity);
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image_url && (
                  <div className="aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {product.description}
                      </CardDescription>
                    </div>
                    <Badge variant={stockStatus.variant} className="shrink-0">
                      {stockStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Price:</span>
                    <div className="text-right">
                      <div className="font-semibold text-lg">KES {product.price.toFixed(2)}</div>
                      {product.unit_type && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {formatUnitLabel(product.unit_type, product.unit_value, product.unit_label)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-medium">{product.stock_quantity} units</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Category:</span>
                    <Badge variant="outline">{product.category}</Badge>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </div>
  );
}