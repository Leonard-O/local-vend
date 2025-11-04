import { useState, useMemo } from 'react';
import DashboardHeader from '@/components/DashboardHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Bike, Store, TrendingUp, Plus, Edit, Trash2 } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Vendor, Rider } from '@/types';

export default function AdminDashboard() {
  const { vendors, riders, deliveries, deleteVendor, deleteRider, addVendor, addRider } = useData();
  const { toast } = useToast();
  const [vendorDialog, setVendorDialog] = useState(false);
  const [riderDialog, setRiderDialog] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    address: '',
  });
  const [riderForm, setRiderForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const stats = useMemo(() => ({
    totalVendors: vendors.length,
    totalRiders: riders.length,
    activeRiders: riders.filter(r => r.status === 'available' || r.status === 'busy').length,
    totalDeliveries: deliveries.length,
    completedDeliveries: deliveries.filter(d => d.status === 'delivered').length,
    revenue: deliveries
      .filter(d => d.status === 'delivered')
      .reduce((sum, d) => sum + d.totalAmount, 0),
  }), [vendors, riders, deliveries]);

  const handleDeleteVendor = (vendorId: string, vendorName: string) => {
    if (confirm(`Are you sure you want to delete vendor "${vendorName}"?`)) {
      deleteVendor(vendorId);
      toast({
        title: 'Vendor Deleted',
        description: `${vendorName} has been removed from the system.`,
      });
    }
  };

  const handleDeleteRider = (riderId: string, riderName: string) => {
    if (confirm(`Are you sure you want to delete rider "${riderName}"?`)) {
      deleteRider(riderId);
      toast({
        title: 'Rider Deleted',
        description: `${riderName} has been removed from the system.`,
      });
    }
  };

  const handleAddVendor = () => {
    setVendorDialog(true);
  };

  const handleSubmitVendor = () => {
    if (!vendorForm.name || !vendorForm.email || !vendorForm.businessName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newVendor: Vendor = {
      id: `vendor_${Date.now()}`,
      name: vendorForm.name,
      email: vendorForm.email,
      phone: vendorForm.phone,
      businessName: vendorForm.businessName,
      address: vendorForm.address,
      role: 'vendor',
      rating: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
    };

    addVendor(newVendor);
    toast({
      title: 'Vendor Added',
      description: `${vendorForm.businessName} has been added successfully.`,
    });

    setVendorDialog(false);
    setVendorForm({
      name: '',
      email: '',
      phone: '',
      businessName: '',
      address: '',
    });
  };

  const handleAddRider = () => {
    setRiderDialog(true);
  };

  const handleSubmitRider = () => {
    if (!riderForm.name || !riderForm.email || !riderForm.phone) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const newRider: Rider = {
      id: `rider_${Date.now()}`,
      name: riderForm.name,
      email: riderForm.email,
      phone: riderForm.phone,
      role: 'rider',
      status: 'available',
      activeDeliveries: 0,
      totalDeliveries: 0,
      rating: 0,
      averageDeliveryTime: 0,
      createdAt: new Date().toISOString(),
    };

    addRider(newRider);
    toast({
      title: 'Rider Added',
      description: `${riderForm.name} has been added successfully.`,
    });

    setRiderDialog(false);
    setRiderForm({
      name: '',
      email: '',
      phone: '',
    });
  };

  const handleEditVendor = (vendorName: string) => {
    toast({
      title: 'Feature Coming Soon',
      description: `Edit functionality for ${vendorName} will be available soon.`,
    });
  };

  const handleEditRider = (riderName: string) => {
    toast({
      title: 'Feature Coming Soon',
      description: `Edit functionality for ${riderName} will be available soon.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage vendors, riders, and monitor system performance
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Store className="w-6 h-6 text-primary" />
                </div>
                <p className="text-3xl font-bold">{stats.totalVendors}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Riders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                  <Bike className="w-6 h-6 text-green-600 dark:text-green-500" />
                </div>
                <p className="text-3xl font-bold">{stats.activeRiders}/{stats.totalRiders}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Deliveries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-500" />
                </div>
                <p className="text-3xl font-bold">{stats.totalDeliveries}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <p className="text-3xl font-bold">KES {stats.revenue.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="vendors" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-auto">
            <TabsTrigger value="vendors" className="gap-2 py-3">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Vendors</span>
            </TabsTrigger>
            <TabsTrigger value="riders" className="gap-2 py-3">
              <Bike className="w-4 h-4" />
              <span className="hidden sm:inline">Riders</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 py-3">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
          </TabsList>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Vendor Management</h3>
              <Button className="gap-2" onClick={handleAddVendor}>
                <Plus className="w-4 h-4" />
                Add Vendor
              </Button>
            </div>

            <div className="grid gap-4">
              {vendors.map((vendor) => (
                <Card key={vendor.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{vendor.businessName}</CardTitle>
                        <p className="text-sm text-muted-foreground">{vendor.name}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleEditVendor(vendor.businessName)}
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteVendor(vendor.id, vendor.businessName)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="grid sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Email</p>
                      <p className="font-medium">{vendor.email}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Phone</p>
                      <p className="font-medium">{vendor.phone}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Address</p>
                      <p className="font-medium">{vendor.address}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Riders Tab */}
          <TabsContent value="riders" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Rider Management</h3>
              <Button className="gap-2" onClick={handleAddRider}>
                <Plus className="w-4 h-4" />
                Add Rider
              </Button>
            </div>

            <div className="grid gap-4">
              {riders.map((rider) => {
                const statusConfig = {
                  available: { label: 'Available', variant: 'default' as const, color: 'bg-green-100 text-green-700' },
                  busy: { label: 'Busy', variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-700' },
                  offline: { label: 'Offline', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-700' },
                };
                const config = statusConfig[rider.status];

                return (
                  <Card key={rider.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">{rider.name}</CardTitle>
                            <Badge variant={config.variant} className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rider.activeDeliveries} active {rider.activeDeliveries === 1 ? 'delivery' : 'deliveries'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleEditRider(rider.name)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteRider(rider.id, rider.name)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1">Email</p>
                        <p className="font-medium">{rider.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Phone</p>
                        <p className="font-medium">{rider.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <h3 className="text-lg font-semibold">System Analytics</h3>
            
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Completed</span>
                    <span className="text-lg font-bold text-green-600">
                      {stats.completedDeliveries}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">In Progress</span>
                    <span className="text-lg font-bold text-blue-600">
                      {deliveries.filter(d => d.status === 'in_transit' || d.status === 'assigned').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pending</span>
                    <span className="text-lg font-bold text-yellow-600">
                      {deliveries.filter(d => d.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Failed</span>
                    <span className="text-lg font-bold text-red-600">
                      {deliveries.filter(d => d.status === 'failed').length}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Success Rate</span>
                    <span className="text-lg font-bold">
                      {stats.totalDeliveries > 0 
                        ? ((stats.completedDeliveries / stats.totalDeliveries) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                    <span className="text-lg font-bold">
                      ${stats.completedDeliveries > 0 
                        ? (stats.revenue / stats.completedDeliveries).toFixed(2)
                        : '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Vendors</span>
                    <span className="text-lg font-bold">{stats.totalVendors}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rider Utilization</span>
                    <span className="text-lg font-bold">
                      {stats.totalRiders > 0
                        ? ((stats.activeRiders / stats.totalRiders) * 100).toFixed(0)
                        : 0}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Add Vendor Dialog */}
      <Dialog open={vendorDialog} onOpenChange={setVendorDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="businessName">Business Name *</Label>
              <Input
                id="businessName"
                value={vendorForm.businessName}
                onChange={(e) => setVendorForm({ ...vendorForm, businessName: e.target.value })}
                placeholder="e.g., Fresh Mart"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorName">Owner Name *</Label>
              <Input
                id="vendorName"
                value={vendorForm.name}
                onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorEmail">Email *</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={vendorForm.email}
                onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorPhone">Phone</Label>
              <Input
                id="vendorPhone"
                value={vendorForm.phone}
                onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                placeholder="+254 700 000000"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendorAddress">Address</Label>
              <Input
                id="vendorAddress"
                value={vendorForm.address}
                onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                placeholder="123 Main St, Nairobi"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVendorDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitVendor}>Add Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rider Dialog */}
      <Dialog open={riderDialog} onOpenChange={setRiderDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Rider</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="riderName">Full Name *</Label>
              <Input
                id="riderName"
                value={riderForm.name}
                onChange={(e) => setRiderForm({ ...riderForm, name: e.target.value })}
                placeholder="e.g., Jane Smith"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="riderEmail">Email *</Label>
              <Input
                id="riderEmail"
                type="email"
                value={riderForm.email}
                onChange={(e) => setRiderForm({ ...riderForm, email: e.target.value })}
                placeholder="rider@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="riderPhone">Phone *</Label>
              <Input
                id="riderPhone"
                value={riderForm.phone}
                onChange={(e) => setRiderForm({ ...riderForm, phone: e.target.value })}
                placeholder="+254 700 000000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRiderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRider}>Add Rider</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}