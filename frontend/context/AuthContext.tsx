'use client';

import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
import {
  clearAuth,
  getCurrentUser,
  getToken,
  setCurrentUser,
  setToken,
} from '@/lib/auth';
import type { User, Role } from '@/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: Role | Role[]) => boolean;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  isAuthenticated: false,
  login: () => {},
  logout: async () => {},
  refreshUser: async () => {},
  hasRole: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        return;
      }
      const res = await authAPI.getMe();
      const fetchedUser = res.data?.data as User;
      setUser(fetchedUser);
      setCurrentUser(fetchedUser);
    } catch {
      clearAuth();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const stored = getCurrentUser();
    if (stored && getToken()) {
      setUser(stored);
    }
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback((token: string, u: User) => {
    setToken(token);
    setCurrentUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      setUser(null);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, []);

  const hasRole = useCallback(
    (role: Role | Role[]) => {
      if (!user) return false;
      if (Array.isArray(role)) return role.includes(user.role);
      return user.role === role;
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
