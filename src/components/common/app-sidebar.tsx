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
  FileText,
  SearchCheck,
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
import { useRoles } from '@/hooks/use-roles';
import type { UserRole } from '@/types/api';
import { Logo } from './logo';
import { Separator } from '../ui/separator';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
}

const mainMenu: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['holder', 'admin', 'viewer', 'issuer', 'verifier'] },
  { href: '/dashboard/credentials', label: 'Credentials', icon: Wallet, roles: ['holder', 'admin'] },
  { href: '/dashboard/issuer', label: 'Issue Credentials', icon: FileText, roles: ['issuer', 'admin'] },
  { href: '/dashboard/verifier', label: 'Verify Proofs', icon: SearchCheck, roles: ['verifier', 'admin'] },
  { href: '/dashboard/connections', label: 'Connections', icon: Users, roles: ['holder', 'admin', 'issuer'] },
  { href: '/dashboard/proofs', label: 'Proof Requests', icon: ShieldCheck, roles: ['holder', 'admin', 'verifier'] },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell, roles: ['holder', 'admin', 'issuer', 'verifier'] },
];

const footerMenu: NavItem[] = [
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, roles: ['admin', 'holder'] },
  { href: '/help', label: 'Help & Support', icon: LifeBuoy, roles: ['holder', 'admin', 'issuer', 'verifier', 'viewer'] },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { notifications } = useDashboard();
  const { hasAnyRole, primaryRole, roles } = useRoles();
  const unreadNotifications = React.useMemo(
    () => notifications.filter((item) => !item.is_read).length,
    [notifications],
  );

  const isActive = React.useCallback((href: string) => pathname.startsWith(href), [pathname]);

  // Get role-specific color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-destructive text-destructive-foreground';
      case 'issuer': return 'bg-blue-500 text-white';
      case 'verifier': return 'bg-green-500 text-white';
      case 'holder': return 'bg-primary text-primary-foreground';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <Logo href="/dashboard" />
        <div className="mt-2 px-2">
          <Badge className={`w-full justify-center text-xs font-medium ${getRoleColor(primaryRole)}`}>
            {primaryRole.toUpperCase()} ACCOUNT
          </Badge>
          {roles.length > 1 && (
            <p className="mt-1 text-xs text-center text-muted-foreground">
              +{roles.length - 1} more {roles.length === 2 ? 'role' : 'roles'}
            </p>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {mainMenu
            .filter((item) => hasAnyRole(item.roles))
            .map((item) => {
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
          {footerMenu
            .filter((item) => hasAnyRole(item.roles))
            .map((item) => (
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
