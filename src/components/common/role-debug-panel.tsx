'use client';

import * as React from 'react';
import { useAuth } from '@/context/auth-context';
import { useRoles } from '@/hooks/use-roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function RoleDebugPanel() {
  const [isVisible, setIsVisible] = React.useState(false);
  const { user, roles: authRoles } = useAuth();
  const { roles, primaryRole } = useRoles();

  // Auto-show on development
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Role Debug Info</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <div>
            <p className="font-medium">Username:</p>
            <p className="text-muted-foreground">{user?.username || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">Primary Role:</p>
            <Badge variant="default">{primaryRole}</Badge>
          </div>
          <div>
            <p className="font-medium">All Roles (from useAuth):</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {authRoles.length > 0 ? (
                authRoles.map((role) => (
                  <Badge key={role} variant="secondary" className="text-xs">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium">All Roles (from useRoles):</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">
                    {role}
                  </Badge>
                ))
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="font-medium">User Object Role:</p>
            <p className="text-muted-foreground">{user?.role || 'N/A'}</p>
          </div>
          <div>
            <p className="font-medium">User Object Roles Array:</p>
            <p className="text-muted-foreground">
              {user?.roles ? JSON.stringify(user.roles) : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
