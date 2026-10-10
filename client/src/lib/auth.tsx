/**
 * Authentication context and provider.
 *
 * Manages the current user, login/register/logout flows, and protects routes
 * via the `useAuth` hook.
 *
 * @module lib/auth
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from './api';

export interface UserProfile {
  _id: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  organization?: string | { _id: string; name: string };
  emailVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  subscription?: {
    planId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  };
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

function normalizeUser(raw: Record<string, unknown>): UserProfile {
  return {
    _id: (raw._id || raw.id) as string,
    id: (raw._id || raw.id) as string,
    email: raw.email as string,
    firstName: raw.firstName as string,
    lastName: raw.lastName as string,
    role: (raw.role as UserProfile['role']) || 'user',
    organization: raw.organization as UserProfile['organization'],
    emailVerified: raw.emailVerified as boolean | undefined,
    lastLogin: raw.lastLogin as string | undefined,
    createdAt: raw.createdAt as string | undefined,
    subscription: raw.subscription as UserProfile['subscription'],
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load the current user on mount if a token exists
  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      if (!api.isAuthenticated()) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const { data } = await api.get<{ data: { user: Record<string, unknown> } }>('/users/me');
        if (mounted) setUser(normalizeUser(data.data.user));
      } catch {
        // Token invalid/expired — clear and let the interceptor redirect
        api.clearAuth();
        if (mounted) setUser(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadUser();

    const onLogout = () => {
      setUser(null);
      navigate('/login');
    };

    window.addEventListener('auth:logout', onLogout as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('auth:logout', onLogout as EventListener);
    };
  }, [navigate]);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { data } = await api.post<{
        success: boolean;
        data: { user: Record<string, unknown>; token: string };
      }>('/auth/login', { email, password });

      if (!data.success || !data.data) {
        throw new Error('Login failed');
      }

      api.setAuthTokens({
        accessToken: data.data.token,
        expiresIn: 24 * 60 * 60,
      });
      setUser(normalizeUser(data.data.user));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Login failed';
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (payload: RegisterData) => {
    setError(null);
    try {
      const { data } = await api.post<{
        success: boolean;
        data: { user: Record<string, unknown>; token: string };
      }>('/auth/register', payload);

      if (!data.success || !data.data) {
        throw new Error('Registration failed');
      }

      api.setAuthTokens({
        accessToken: data.data.token,
        expiresIn: 24 * 60 * 60,
      });
      setUser(normalizeUser(data.data.user));
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        'Registration failed';
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      api.clearAuth();
      setUser(null);
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    try {
      const { data } = await api.get<{ data: { user: Record<string, unknown> } }>('/users/me');
      setUser(normalizeUser(data.data.user));
    } catch {
      api.clearAuth();
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      logout,
      refreshUser,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
    }),
    [user, loading, error, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}