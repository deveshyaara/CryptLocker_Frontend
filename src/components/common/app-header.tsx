'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Home,
  LifeBuoy,
  LogOut,
  Search,
  Settings,
} from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '@/context/auth-context';
import { useDashboard } from '@/context/dashboard-context';
import { formatDistanceToNow } from 'date-fns';
import type { Notification } from '@/types/api';
import { Separator } from '../ui/separator';

function getInitials(name?: string) {
  if (!name) {
    return 'U';
  }
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
}

function formatNotificationTime(notification: Notification) {
  if (!notification.created_at) {
    return '';
  }
  try {
    return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
  } catch (error) {
    console.warn('Unable to format notification time', error);
    return '';
  }
}

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const {
    notifications,
    notificationsLoading,
    markAllNotificationsAsRead,
  } = useDashboard();

  const unreadCount = React.useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const topNotifications = React.useMemo(
    () => notifications.slice(0, 6),
    [notifications],
  );

  const handleLogout = React.useCallback(() => {
    logout();
    router.replace('/login');
  }, [logout, router]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="flex w-full items-center gap-4 md:gap-2 lg:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search credentials..."
            className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-1/3"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
                </span>
              ) : null}
              <span className="sr-only">Toggle notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-4">
              <h4 className="text-lg font-medium">Notifications</h4>
              <p className="text-sm text-muted-foreground">
                {notificationsLoading
                  ? 'Loading notifications...'
                  : unreadCount > 0
                    ? `You have ${unreadCount} unread ${unreadCount === 1 ? 'notification' : 'notifications'}.`
                    : 'You are all caught up.'}
              </p>
            </div>
            <Separator />
            <div className="max-h-96 overflow-y-auto p-2">
              {topNotifications.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                topNotifications.map((note) => (
                  <div
                    key={note.id}
                    className="mb-2 grid grid-cols-[25px_1fr] items-start pb-4 last:mb-0 last:pb-0"
                  >
                    <span
                      className={`flex h-2 w-2 translate-y-1 rounded-full ${
                        note.is_read ? 'bg-muted' : 'bg-primary'
                      }`}
                    />
                    <div className="grid gap-1">
                      <p className="text-sm font-medium leading-none">{note.title}</p>
                      <p className="text-sm text-muted-foreground">{note.message}</p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatNotificationTime(note)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Separator />
            <div className="p-2">
              <Button
                size="sm"
                className="w-full"
                variant={unreadCount > 0 ? 'default' : 'outline'}
                onClick={markAllNotificationsAsRead}
                disabled={unreadCount === 0 || notificationsLoading}
              >
                Mark all as read
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback>{getInitials(user?.full_name || user?.username)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.full_name || user?.username || 'User'}
                </p>
                {user?.email ? (
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <Home className="mr-2" /> Dashboard
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">
                <Settings className="mr-2" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/help">
                <LifeBuoy className="mr-2" /> Help &amp; Support
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
