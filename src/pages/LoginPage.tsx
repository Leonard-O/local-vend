import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Package, Moon, Sun } from 'lucide-react';
import type { UserRole } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Register form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const additionalData: any = {};
      
      if (role === 'vendor') {
        if (!businessName || !address) {
          setError('Business name and address are required for vendors');
          setIsLoading(false);
          return;
        }
        additionalData.businessName = businessName;
        additionalData.address = address;
        additionalData.locationLat = 40.7128 + (Math.random() - 0.5) * 0.1;
        additionalData.locationLng = -74.0060 + (Math.random() - 0.5) * 0.1;
      } else if (role === 'customer') {
        additionalData.address = address || '';
        additionalData.locationLat = 40.7489 + (Math.random() - 0.5) * 0.1;
        additionalData.locationLng = -73.9680 + (Math.random() - 0.5) * 0.1;
      } else if (role === 'rider') {
        additionalData.locationLat = 40.7580 + (Math.random() - 0.5) * 0.1;
        additionalData.locationLng = -73.9855 + (Math.random() - 0.5) * 0.1;
      }

      await register(email, password, name, phone, role, additionalData);
      
      // Wait a moment for the database record to be created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to auto-login
      try {
        await login(email, password);
      } catch (loginError) {
        // If auto-login fails, just show success message
        console.log('Auto-login failed, user can login manually:', loginError);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="rounded-full"
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>
      </div>

      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-3xl font-bold">LocalVend</CardTitle>
          <CardDescription className="text-base">
            Delivery Management System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-phone">Phone Number</Label>
                  <Input
                    id="register-phone"
                    type="tel"
                    placeholder="+254 XXX XXX XXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-role">Register As</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger id="register-role" className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="rider">Rider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === 'vendor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="register-business">Business Name</Label>
                      <Input
                        id="register-business"
                        type="text"
                        placeholder="Your business name"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-address">Business Address</Label>
                      <Input
                        id="register-address"
                        type="text"
                        placeholder="Your business address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                  </>
                )}

                {role === 'customer' && (
                  <div className="space-y-2">
                    <Label htmlFor="register-address">Delivery Address (Optional)</Label>
                    <Input
                      id="register-address"
                      type="text"
                      placeholder="Your delivery address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-11"
                    />
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full h-11 text-base" disabled={isLoading}>
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground text-center mb-3 font-medium">
              Demo Accounts
            </p>
            <div className="space-y-2 text-xs text-muted-foreground bg-muted/50 p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">Vendor:</span>
                <span>vendor@demo.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rider:</span>
                <span>rider@demo.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Admin:</span>
                <span>admin@demo.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Customer:</span>
                <span>customer@demo.com</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-border/50">
                <span className="font-medium">Password:</span>
                <span>demo123</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}