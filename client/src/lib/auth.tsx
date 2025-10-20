import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from './queryClient';

interface User {
  id: string;
  username: string;
  businessName: string | null;
  email: string;
  role: string;
  emailPreferences?: {
    weeklyReports: boolean;
    lowCashAlerts: boolean;
    overdueInvoices: boolean;
    integrationFailures: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(username: string, password: string): Promise<User> {
    const res = await apiRequest('POST', '/api/auth/login', {
      username,
      password
    });
    const userData = await res.json();
    setUser(userData);
    
    // Small delay to ensure session cookie is fully set in browser
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify session was established
    await checkAuth();
    
    return userData;
  }

  async function logout() {
    try {
      await apiRequest('POST', '/api/auth/logout');
    } catch (error) {
      // Ignore server logout errors - clearing client state is what matters
      console.warn('Server logout failed, but clearing client session:', error);
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
