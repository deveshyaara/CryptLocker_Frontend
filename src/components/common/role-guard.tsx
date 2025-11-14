'use client';

import * as React from 'react';

import { useAuth } from '@/context/auth-context';
import { useRoles } from '@/hooks/use-roles';
import type { UserRole } from '@/types/api';

interface RoleGuardProps {
  allowedRoles?: UserRole[];
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RoleGuard({
  allowedRoles = [],
  fallback,
  loadingFallback,
  children,
}: RoleGuardProps) {
  const { loading } = useAuth();
  const { checkRoles } = useRoles();

  if (loading) {
    return (
      <>
        {loadingFallback ?? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
            Checking your access...
          </div>
        )}
      </>
    );
  }

  if (!checkRoles(allowedRoles)) {
    return (
      <>
        {fallback ?? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            You do not have permission to view this content.
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
