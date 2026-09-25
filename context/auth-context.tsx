'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiRequest, getAuthToken, setAuthToken, removeAuthToken } from '@/lib/api';
import { toast } from 'sonner';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkSession = async () => {
      const existingToken = getAuthToken();
      let storedUser: AdminUser | null = null;

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('admin_user');
          if (raw) storedUser = JSON.parse(raw);
        } catch (_) {}
      }

      if (existingToken) {
        setToken(existingToken);
        if (storedUser) setUser(storedUser);

        try {
          const res = await apiRequest('/auth/me');
          const verifiedUser = res?.data?.user || res?.user;
          if (verifiedUser && verifiedUser.role === 'admin') {
            setUser(verifiedUser);
            setAuthToken(existingToken, verifiedUser);
          } else if (verifiedUser && verifiedUser.role !== 'admin') {
            removeAuthToken();
            setUser(null);
            setToken(null);
          }
        } catch (err: any) {
          // Only wipe session if server explicitly rejected authentication with 401
          if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
            removeAuthToken();
            setUser(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!user && pathname !== '/login') {
        router.push('/login');
      } else if (user && pathname === '/login') {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: identifier,
          email: identifier,
          identifier,
          password,
        }),
      });

      const data = res.data;
      if (!data || !data.token || !data.user) {
        throw new Error('Invalid authentication response');
      }

      if (data.user.role !== 'admin') {
        throw new Error('Access denied. Admin credentials required.');
      }

      setAuthToken(data.token, data.user);
      setToken(data.token);
      setUser(data.user);

      toast.success('Welcome back, Admin!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    setToken(null);
    toast.info('Logged out successfully');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
