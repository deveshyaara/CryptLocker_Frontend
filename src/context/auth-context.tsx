'use client';

/// <reference types="react" />

import * as React from 'react';

import {
  getCurrentUser,
  loginUser,
  registerUser,
} from '@/lib/api/holder';
import type { ApiService } from '@/lib/api/config';
import type {
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  User,
  UserRole,
} from '@/types/api';

const TOKEN_STORAGE_KEY = 'cryptlocker.accessToken';
const SERVICE_STORAGE_KEY = 'cryptlocker.apiService';

const DEFAULT_ROLE: UserRole = 'holder';

function extractRoles(input: Partial<Pick<User, 'roles' | 'role'>>): UserRole[] {
  const rawRoles = [
    ...(Array.isArray(input.roles) ? input.roles : []),
    ...(input.role ? [input.role] : []),
  ]
    .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
    .filter((role): role is string => role.length > 0);

  const uniqueRoles = Array.from(new Set(rawRoles)) as UserRole[];
  return uniqueRoles.length > 0 ? uniqueRoles : [DEFAULT_ROLE];
}

function normalizeUser(user: User): User {
  const roles = extractRoles(user);
  const permissions = Array.isArray(user.permissions)
    ? Array.from(
        new Set(
          user.permissions
            .map((item) => (typeof item === 'string' ? item.trim() : String(item)).toLowerCase())
            .filter((item) => item.length > 0),
        ),
      )
    : [];

  // Log for debugging role assignment (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('Normalizing user:', {
      username: user.username,
      originalRole: user.role,
      originalRoles: user.roles,
      normalizedRoles: roles,
      primaryRole: roles[0],
    });
  }

  return {
    ...user,
    role: roles[0] ?? DEFAULT_ROLE,
    roles,
    permissions,
  };
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  service: ApiService;
  loading: boolean;
  login: (username: string, password: string, service?: ApiService) => Promise<LoginResponse>;
  register: (payload: RegisterRequest, service?: ApiService) => Promise<RegisterResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  roles: UserRole[];
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles?: UserRole[]) => boolean;
  hasEveryRole: (roles?: UserRole[]) => boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

interface StoredAuth {
  token: string | null;
  service: ApiService;
}

function getStoredAuth(): StoredAuth {
  if (typeof window === 'undefined') {
    return { token: null, service: 'holder' };
  }

  const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  const storedService = localStorage.getItem(SERVICE_STORAGE_KEY) as ApiService | null;

  return {
    token: storedToken,
    service: storedService ?? 'holder',
  };
}

function persistAuth(token: string | null, service: ApiService | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  if (service) {
    localStorage.setItem(SERVICE_STORAGE_KEY, service);
  } else {
    localStorage.removeItem(SERVICE_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [service, setService] = React.useState<ApiService>('holder');

  const syncProfile = React.useCallback(
    async (accessToken: string | null, activeService: ApiService) => {
      if (!accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser(accessToken, activeService);
        setUser(normalizeUser(profile));
      } catch (error) {
        console.error('Failed to load user profile', error);

        // Only clear token if it's an authentication error (401/403)
        // Keep token for network errors to allow retry
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as { status: number }).status;
          if (status === 401 || status === 403) {
            setToken(null);
            setService('holder');
            persistAuth(null, null);
          }
        }

        setUser(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  React.useEffect(() => {
    const storedAuth = getStoredAuth();
    setToken(storedAuth.token);
    setService(storedAuth.service);
    syncProfile(storedAuth.token, storedAuth.service);
  }, [syncProfile]);

  const login = React.useCallback(
    async (username: string, password: string, selectedService: ApiService = 'holder') => {
      const response = await loginUser(username, password, selectedService);
      const accessToken = response.access_token;
      setToken(accessToken);
      setService(selectedService);
      const normalizedUser = normalizeUser(response.user);
      setUser(normalizedUser);
      persistAuth(accessToken, selectedService);
      
      // Sync user to local database for file uploads and stats
      if (accessToken && normalizedUser) {
        try {
          await fetch('/api/db/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              username: normalizedUser.username,
              email: normalizedUser.email,
              full_name: normalizedUser.full_name,
              role: normalizedUser.role || normalizedUser.roles?.[0],
              user_id: normalizedUser.id,
            }),
          });
        } catch (syncError) {
          console.warn('Failed to sync user to local database:', syncError);
        }
      }
      
      return { ...response, user: normalizedUser };
    },
    [],
  );

  const register = React.useCallback(
    async (payload: RegisterRequest, selectedService: ApiService = 'holder') => {
      const response = await registerUser(payload, selectedService);
      const loginResponse = await login(payload.username, payload.password, selectedService);
      
      // Sync user to local database for file uploads and stats
      if (loginResponse.access_token && loginResponse.user) {
        try {
          await fetch('/api/db/sync-user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${loginResponse.access_token}`,
            },
            body: JSON.stringify({
              username: loginResponse.user.username,
              email: loginResponse.user.email,
              full_name: loginResponse.user.full_name,
              role: loginResponse.user.role || payload.role,
              user_id: loginResponse.user.id,
            }),
          });
        } catch (syncError) {
          console.warn('Failed to sync user to local database:', syncError);
        }
      }
      
      return response;
    },
    [login],
  );

  const logout = React.useCallback(() => {
    setToken(null);
    setUser(null);
    setService('holder');
    persistAuth(null, null);
  }, []);

  const refreshProfile = React.useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const profile = await getCurrentUser(token, service);
      setUser(normalizeUser(profile));
    } catch (error) {
      console.error('Failed to refresh user profile', error);
      logout();
    }
  }, [logout, token, service]);

  const roles = React.useMemo<UserRole[]>(() => user?.roles ?? [], [user]);

  const hasRole = React.useCallback(
    (role: UserRole) => {
      if (!role) {
        return false;
      }
      const normalized = role.toString().trim().toLowerCase() as UserRole;
      return roles.includes(normalized);
    },
    [roles],
  );

  const hasAnyRole = React.useCallback(
    (requiredRoles: UserRole[] = []) => {
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
      return requiredRoles.some((required) => hasRole(required));
    },
    [hasRole],
  );

  const hasEveryRole = React.useCallback(
    (requiredRoles: UserRole[] = []) => {
      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }
      return requiredRoles.every((required) => hasRole(required));
    },
    [hasRole],
  );

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      service,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      roles,
      hasRole,
      hasAnyRole,
      hasEveryRole,
    }),
    [
      user,
      token,
      service,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      roles,
      hasRole,
      hasAnyRole,
      hasEveryRole,
    ],
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
