import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface UseAdminAuthReturn {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

export default function useAdminAuth(): UseAdminAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have user data in localStorage
        const adminUserStr = localStorage.getItem('adminUser');
        
        if (adminUserStr) {
          // If we have user data, we're authenticated
          const adminUser = JSON.parse(adminUserStr) as AdminUser;
          setUser(adminUser);
          setIsAuthenticated(true);
        } else {
          // If we don't have user data but have a token cookie, validate it
          const hasTokenCookie = document.cookie.includes('token=');
          
          if (hasTokenCookie) {
            // Validate the token by making a request to a protected endpoint
            try {
              const response = await fetch('/api/admin/auth/validate', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // Important for cookies
              });
              
              if (response.ok) {
                const data = await response.json();
                setUser(data.data.user);
                localStorage.setItem('adminUser', JSON.stringify(data.data.user));
                setIsAuthenticated(true);
              } else {
                // Token is invalid
                setUser(null);
                setIsAuthenticated(false);
                localStorage.removeItem('adminUser');
              }
            } catch (error) {
              console.error('Error validating token:', error);
              setUser(null);
              setIsAuthenticated(false);
              localStorage.removeItem('adminUser');
            }
          } else {
            // No token cookie
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('adminUser');
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('adminUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data in localStorage
        // The token is stored in an HttpOnly cookie by the server
        localStorage.setItem('adminUser', JSON.stringify(data.data.user));
        
        // Update state
        setUser(data.data.user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, message: data.message || 'Invalid email or password' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Call logout API
      await fetch('/api/admin/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('adminUser');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Redirect to login page
      router.push('/admin/login');
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
