'use client';

import type { ReactNode } from 'react';
import type { LoginCredentials, User } from '@/types/auth';
import React, { createContext, useEffect, useState } from 'react';
import { apiFetcher } from '@/lib/api-fetcher';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  const clearError = () => {
    setError(null);
  };

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null); // Clear any previous errors

      const response = await apiFetcher('auth/login/', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Check if user is staff before allowing login
      if (response.user && !response.user.is_staff) {
        const errorMessage = 'Only staff users are allowed to access this application.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Store JWT tokens
      localStorage.setItem('token', response.access);
      localStorage.setItem('refresh_token', response.refresh);

      // Set user data
      if (response.user) {
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      return { success: true };
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const errorMessage = 'Network error. Please check your connection and try again.';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      // Handle API errors
      if (error instanceof Error) {
        let errorMessage = error.message;

        // Make some error messages more user-friendly
        if (errorMessage.toLowerCase().includes('unable to log in with provided credentials')) {
          errorMessage = 'Invalid username or password. Please try again.';
        } else if (errorMessage.toLowerCase().includes('invalid credentials')) {
          errorMessage = 'Invalid username or password. Please try again.';
        }

        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const genericError = 'An unexpected error occurred';
      setError(genericError);
      return { success: false, error: genericError };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Call logout endpoint if available
      try {
        await apiFetcher('auth/logout/', {
          method: 'POST',
        });
      } catch (error) {
        // If logout endpoint fails, we still clear local state
        console.warn('Logout endpoint failed:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      setIsLoading(false);
    }
  };

  const checkAuth = async (): Promise<void> => {
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // Check localStorage for persisted user and tokens
      const storedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');

      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser);

          // Check if stored user is staff
          if (userData.is_staff) {
            setUser(userData);
          } else {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            setUser(null);
            setError('Only staff users are allowed to access this application.');
          }
        } catch (parseError) {
          // Clear invalid stored data
          console.error('Error parsing stored user data:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('checkAuth error:', error);
      setUser(null);
    } finally {
      // Always set loading to false, regardless of what happened above
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for session expiry events (from apiFetcher) and cross-tab storage changes
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' && e.newValue === null) {
        setUser(null);
      }
    };

    window.addEventListener('session-expired', handleSessionExpired);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        logout,
        checkAuth,
        clearError,
      },
    },
    children,
  );
}

export function useAuth() {
  const context = React.use(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
