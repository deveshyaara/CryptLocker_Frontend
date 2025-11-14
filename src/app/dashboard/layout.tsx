'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { AppHeader } from '@/components/common/app-header';
import { AppSidebar } from '@/components/common/app-sidebar';
import { RoleGuard } from '@/components/common/role-guard';
import { RoleDebugPanel } from '@/components/common/role-debug-panel';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { DashboardProvider } from '@/context/dashboard-context';
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/lib/api/holder';
import type { Notification } from '@/types/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();

  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);

  const refreshNotifications = React.useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }

    try {
      setNotificationsLoading(true);
      const data = await getNotifications(token);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (!authLoading && !token) {
      router.replace('/login');
    }
  }, [authLoading, token, router]);

  React.useEffect(() => {
    if (!token) {
      return;
    }
    refreshNotifications();
  }, [token, refreshNotifications]);

  const handleMarkNotificationAsRead = React.useCallback(
    async (id: number) => {
      if (!token) {
        return;
      }
      try {
        await markNotificationAsRead(token, id);
        await refreshNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
    },
    [token, refreshNotifications],
  );

  const handleMarkAllNotificationsAsRead = React.useCallback(async () => {
    if (!token) {
      return;
    }
    try {
      await markAllNotificationsAsRead(token);
      await refreshNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  }, [token, refreshNotifications]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-secondary/50">
        <div className="text-sm text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!token) {
    return null;
  }

  return (
    <RoleGuard
      allowedRoles={['holder', 'admin', 'issuer', 'verifier']}
      fallback={(
        <div className="flex h-screen items-center justify-center bg-secondary/50">
          <div className="max-w-sm text-center">
            <p className="text-lg font-semibold">Permission required</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account does not have access to the dashboard. Please contact an administrator to
              update your permissions.
            </p>
          </div>
        </div>
      )}
    >
      <DashboardProvider
        value={{
          notifications,
          notificationsLoading,
          refreshNotifications,
          markNotificationAsRead: handleMarkNotificationAsRead,
          markAllNotificationsAsRead: handleMarkAllNotificationsAsRead,
        }}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="bg-secondary/50">
            <AppHeader />
            <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
          </SidebarInset>
          <RoleDebugPanel />
        </SidebarProvider>
      </DashboardProvider>
    </RoleGuard>
  );
}
