'use client';

import * as React from 'react';

import type { Notification } from '@/types/api';

export interface DashboardContextValue {
  notifications: Notification[];
  notificationsLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markNotificationAsRead: (id: number) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}

const DashboardContext = React.createContext<DashboardContextValue | undefined>(
  undefined,
);

export function DashboardProvider({
  value,
  children,
}: {
  value: DashboardContextValue;
  children: React.ReactNode;
}) {
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = React.useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
