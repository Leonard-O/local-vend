import React, { createContext, useContext, useState, useEffect } from 'react';

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
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => void;
  updateLocation: (lat: number, lng: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem('localvend_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock authentication - in production, this would call an API
    setIsLoading(true);
    
    // Demo users for testing
    const demoUsers: Record<string, User> = {
      'vendor@demo.com': { id: '1', email: 'vendor@demo.com', name: 'John Vendor', role: 'vendor', locationLat: 40.7128, locationLng: -74.0060, phone: '+1234567893', businessName: 'Fresh Local Market', address: '123 Market St, City' },
      'rider@demo.com': { id: '2', email: 'rider@demo.com', name: 'Mike Rider', role: 'rider', locationLat: 40.7580, locationLng: -73.9855, phone: '+1234567890' },
      'admin@demo.com': { id: '3', email: 'admin@demo.com', name: 'Admin User', role: 'admin' },
      'customer@demo.com': { id: '4', email: 'customer@demo.com', name: 'Jane Customer', role: 'customer', locationLat: 40.7489, locationLng: -73.9680, phone: '+1234567894', address: '456 Oak Ave, City' },
    };

    // Check registered users from localStorage
    const registeredUsers = JSON.parse(localStorage.getItem('localvend_registered_users') || '{}');
    const allUsers = { ...demoUsers, ...registeredUsers };

    await new Promise(resolve => setTimeout(resolve, 500));

    const authenticatedUser = allUsers[email];
    if (authenticatedUser && password === 'demo123') {
      setUser(authenticatedUser);
      localStorage.setItem('localvend_user', JSON.stringify(authenticatedUser));
    } else {
      throw new Error('Invalid credentials');
    }
    
    setIsLoading(false);
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    const registeredUsers = JSON.parse(localStorage.getItem('localvend_registered_users') || '{}');
    const demoUsers = ['vendor@demo.com', 'rider@demo.com', 'admin@demo.com', 'customer@demo.com'];
    
    if (registeredUsers[email] || demoUsers.includes(email)) {
      setIsLoading(false);
      throw new Error('User already exists');
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      email,
      name,
      role,
      locationLat: 40.7128,
      locationLng: -74.0060,
      phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    };

    // Add role-specific fields
    if (role === 'vendor') {
      newUser.businessName = `${name}'s Store`;
      newUser.address = '123 Main St, City';
    } else if (role === 'customer') {
      newUser.address = '456 Oak Ave, City';
    }

    registeredUsers[email] = newUser;
    localStorage.setItem('localvend_registered_users', JSON.stringify(registeredUsers));
    
    // Also add to role-specific storage for DataContext
    if (role === 'vendor') {
      const vendors = JSON.parse(localStorage.getItem('localvend_vendors') || '[]');
      vendors.push({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        businessName: newUser.businessName,
        address: newUser.address,
        locationLat: newUser.locationLat,
        locationLng: newUser.locationLng,
        rating: 5.0
      });
      localStorage.setItem('localvend_vendors', JSON.stringify(vendors));
    } else if (role === 'rider') {
      const riders = JSON.parse(localStorage.getItem('localvend_riders') || '[]');
      riders.push({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        status: 'available',
        activeDeliveries: 0,
        locationLat: newUser.locationLat,
        locationLng: newUser.locationLng,
        rating: 5.0
      });
      localStorage.setItem('localvend_riders', JSON.stringify(riders));
    } else if (role === 'customer') {
      const customers = JSON.parse(localStorage.getItem('localvend_customers') || '[]');
      customers.push({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        address: newUser.address,
        locationLat: newUser.locationLat,
        locationLng: newUser.locationLng,
        rating: 5.0
      });
      localStorage.setItem('localvend_customers', JSON.stringify(customers));
    }
    
    setUser(newUser);
    localStorage.setItem('localvend_user', JSON.stringify(newUser));
    
    // Trigger storage event to refresh data in other contexts
    window.dispatchEvent(new Event('storage'));
    
    setIsLoading(false);
  };

  const updateLocation = (lat: number, lng: number) => {
    if (user) {
      const updatedUser = { ...user, locationLat: lat, locationLng: lng };
      setUser(updatedUser);
      localStorage.setItem('localvend_user', JSON.stringify(updatedUser));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('localvend_user');
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