import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

export type UserRole = 'vendor' | 'rider' | 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  locationLat?: number;
  locationLng?: number;
  phone?: string;
  businessName?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string, role: 'vendor' | 'rider' | 'customer', additionalData?: any) => Promise<any>;
  logout: () => Promise<void>;
  updateLocation: (lat: number, lng: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email!);
      } else {
        // Fallback to localStorage for demo users
        const storedUser = localStorage.getItem('localvend_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user.id, session.user.email!);
      } else {
        setUser(null);
        localStorage.removeItem('localvend_user');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      // Try to load from vendors
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (vendor && !vendorError) {
        const userData: User = {
          id: vendor.id,
          email: vendor.email,
          name: vendor.name,
          role: 'vendor',
          phone: vendor.phone,
          businessName: vendor.business_name,
          address: vendor.address,
          locationLat: vendor.location_lat,
          locationLng: vendor.location_lng,
        };
        setUser(userData);
        localStorage.setItem('localvend_user', JSON.stringify(userData));
        return;
      }

      // Try to load from riders
      const { data: rider, error: riderError } = await supabase
        .from('riders')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (rider && !riderError) {
        const userData: User = {
          id: rider.id,
          email: rider.email,
          name: rider.name,
          role: 'rider',
          phone: rider.phone,
          locationLat: rider.location_lat,
          locationLng: rider.location_lng,
        };
        setUser(userData);
        localStorage.setItem('localvend_user', JSON.stringify(userData));
        return;
      }

      // Try to load from customers
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (customer && !customerError) {
        const userData: User = {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          role: 'customer',
          phone: customer.phone,
          address: customer.address,
          locationLat: customer.location_lat,
          locationLng: customer.location_lng,
        };
        setUser(userData);
        localStorage.setItem('localvend_user', JSON.stringify(userData));
        return;
      }

      // Check if admin (hardcoded for now)
      if (email === 'admin@demo.com') {
        const userData: User = {
          id: userId,
          email,
          name: 'Admin User',
          role: 'admin',
        };
        setUser(userData);
        localStorage.setItem('localvend_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      // Try Supabase auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.log('Supabase auth error:', error.message);
        // Fallback to demo users
        const demoUsers: Record<string, User> = {
          'vendor@demo.com': { id: 'demo-vendor-1', email: 'vendor@demo.com', name: 'John Vendor', role: 'vendor', locationLat: 40.7128, locationLng: -74.0060, phone: '+1234567893', businessName: 'Fresh Local Market', address: '123 Market St, City' },
          'rider@demo.com': { id: 'demo-rider-1', email: 'rider@demo.com', name: 'Mike Rider', role: 'rider', locationLat: 40.7580, locationLng: -73.9855, phone: '+1234567890' },
          'admin@demo.com': { id: 'demo-admin-1', email: 'admin@demo.com', name: 'Admin User', role: 'admin' },
          'customer@demo.com': { id: 'demo-customer-1', email: 'customer@demo.com', name: 'Jane Customer', role: 'customer', locationLat: 40.7489, locationLng: -73.9680, phone: '+1234567894', address: '456 Oak Ave, City' },
        };

        const authenticatedUser = demoUsers[email];
        if (authenticatedUser && password === 'demo123') {
          setUser(authenticatedUser);
          localStorage.setItem('localvend_user', JSON.stringify(authenticatedUser));
          toast({
            title: 'Login Successful',
            description: `Welcome back, ${authenticatedUser.name}!`,
          });
        } else {
          throw new Error('Invalid credentials');
        }
      } else if (data.user) {
        console.log('Supabase auth successful, loading profile for:', data.user.id);
        await loadUserProfile(data.user.id, data.user.email!);
        
        // Check if user was loaded successfully
        const storedUser = localStorage.getItem('localvend_user');
        if (!storedUser) {
          throw new Error('User profile not found. Please contact support.');
        }
        
        toast({
          title: 'Login Successful',
          description: 'Welcome back!',
        });
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Invalid credentials',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone: string, role: 'vendor' | 'rider' | 'customer', additionalData?: any) => {
    try {
      // Create auth user with email confirmation disabled
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name,
            phone,
            role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      const userId = authData.user.id;

      // Insert into role-specific table
      if (role === 'vendor') {
        const { error: vendorError } = await supabase
          .from('vendors')
          .insert([{
            id: userId,
            name,
            email,
            phone,
            business_name: additionalData?.businessName || name,
            address: additionalData?.address || '',
            location_lat: additionalData?.locationLat,
            location_lng: additionalData?.locationLng,
            rating: 0
          }]);
        
        if (vendorError) {
          console.error('Error creating vendor record:', vendorError);
          throw vendorError;
        }
      } else if (role === 'rider') {
        const { error: riderError } = await supabase
          .from('riders')
          .insert([{
            id: userId,
            name,
            email,
            phone,
            status: 'available',
            active_deliveries: 0,
            location_lat: additionalData?.locationLat,
            location_lng: additionalData?.locationLng,
            rating: 0,
            total_deliveries: 0,
            average_delivery_time: 0
          }]);
        
        if (riderError) {
          console.error('Error creating rider record:', riderError);
          throw riderError;
        }
      } else if (role === 'customer') {
        const { error: customerError } = await supabase
          .from('customers')
          .insert([{
            id: userId,
            name,
            email,
            phone,
            address: additionalData?.address || '',
            location_lat: additionalData?.locationLat,
            location_lng: additionalData?.locationLng,
            rating: 0
          }]);
        
        if (customerError) {
          console.error('Error creating customer record:', customerError);
          throw customerError;
        }
      }

      toast({
        title: 'Registration Successful',
        description: 'Your account has been created. You can now login.',
      });

      return authData;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateLocation = (lat: number, lng: number) => {
    if (user) {
      const updatedUser = { ...user, locationLat: lat, locationLng: lng };
      setUser(updatedUser);
      localStorage.setItem('localvend_user', JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('localvend_user');
    toast({
      title: 'Logged Out',
      description: 'You have been logged out successfully',
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateLocation, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};