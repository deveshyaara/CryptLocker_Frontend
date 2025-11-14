'use client';

import * as React from 'react';
import {
  Bell,
  Home,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useDashboard } from '@/context/dashboard-context';
import { Logo } from './logo';
import { Separator } from '../ui/separator';

const mainMenu = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/credentials', label: 'Credentials', icon: Wallet },
  { href: '/dashboard/connections', label: 'Connections', icon: Users },
  { href: '/dashboard/proofs', label: 'Proof Requests', icon: ShieldCheck },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

const footerMenu = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/help', label: 'Help & Support', icon: LifeBuoy },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { notifications } = useDashboard();
  const unreadNotifications = React.useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const isActive = React.useCallback((href: string) => pathname.startsWith(href), [pathname]);

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo href="/dashboard" />
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainMenu.map((item) => {
            const showBadge = item.href === '/dashboard/notifications' && unreadNotifications > 0;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive(item.href)}
                  tooltip={{ children: item.label, side: 'right' }}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                    {showBadge ? (
                      <Badge className="ml-auto" variant="default">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </Badge>
                    ) : null}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Separator className="mb-2" />
        <SidebarMenu>
          {footerMenu.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={isActive(item.href)}
                tooltip={{ children: item.label, side: 'right' }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
