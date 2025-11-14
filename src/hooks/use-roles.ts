'use client';

import * as React from 'react';

import { useAuth } from '@/context/auth-context';
import type { UserRole } from '@/types/api';

interface RoleCheckOptions {
  requireAll?: boolean;
}

function normalizeRequiredRoles(roles: UserRole[] = []): UserRole[] {
  return roles
    .filter((role) => typeof role === 'string' && role.trim().length > 0)
    .map((role) => role.trim().toLowerCase() as UserRole);
}

export function useRoles() {
  const { roles, hasRole, hasAnyRole, hasEveryRole } = useAuth();

  // Log current roles for debugging
  React.useEffect(() => {
    console.log('Current user roles:', roles);
  }, [roles]);

  const primaryRole = React.useMemo(() => roles[0] ?? 'holder', [roles]);

  const checkRoles = React.useCallback(
    (required: UserRole[] = [], options: RoleCheckOptions = {}) => {
      const normalized = normalizeRequiredRoles(required);
      if (normalized.length === 0) {
        return true;
      }
      return options.requireAll ? hasEveryRole(normalized) : hasAnyRole(normalized);
    },
    [hasAnyRole, hasEveryRole],
  );

  const hasAllRoles = React.useCallback(
    (required: UserRole[] = []) => checkRoles(required, { requireAll: true }),
    [checkRoles],
  );

  return {
    roles,
    primaryRole,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    checkRoles,
  };
}
