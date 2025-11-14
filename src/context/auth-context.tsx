'use client';

/// <reference types="react" />

import * as React from 'react';

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '@/lib/api/holder';
import type { LoginResponse, RegisterRequest, RegisterResponse, User } from '@/types/api';

const TOKEN_STORAGE_KEY = 'cryptlocker.accessToken';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<LoginResponse>;
  register: (payload: RegisterRequest) => Promise<RegisterResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

function getStoredToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function persistToken(token: string | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const syncProfile = React.useCallback(
    async (accessToken: string | null) => {
      if (!accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser(accessToken);
        setUser(profile);
      } catch (error) {
        console.error('Failed to load user profile', error);
        setUser(null);
        setToken(null);
        persistToken(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    const storedToken = getStoredToken();
    setToken(storedToken);
    syncProfile(storedToken);
  }, [syncProfile]);

  const login = React.useCallback(
    async (username: string, password: string) => {
      const response = await loginUser(username, password);
      const accessToken = response.access_token;
      setToken(accessToken);
      setUser(response.user);
      persistToken(accessToken);
      return response;
    },
    [],
  );

  const register = React.useCallback(
    async (payload: RegisterRequest) => {
      const response = await registerUser(payload);
      await login(payload.username, payload.password);
      return response;
    },
    [login],
  );

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    persistToken(null);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const profile = await getCurrentUser(token);
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user profile', error);
      logout();
    }
  }, [logout, token]);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout, refreshProfile }),
    [user, token, loading, login, register, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
