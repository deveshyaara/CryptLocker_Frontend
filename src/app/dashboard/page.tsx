'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Link2, QrCode, Shield, Users, Wallet, FileText, SearchCheck } from 'lucide-react';

import { RoleGuard } from '@/components/common/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/context/auth-context';
import { useRoles } from '@/hooks/use-roles';
import { getConnections, getCredentials, getProofRequests } from '@/lib/api/holder';
import type { Connection, Credential, ProofRequest } from '@/types/api';

type AggregatedStats = {
  totalCredentials: number;
  activeConnections: number;
  pendingProofs: number;
};

type ActivityItem = {
  id: string;
  type: 'credential' | 'connection' | 'proof';
  title: string;
  subtitle?: string;
  status?: string;
  createdAt?: string;
};

function buildActivities(
  credentials: Credential[],
  connections: Connection[],
  proofs: ProofRequest[],
): ActivityItem[] {
  const credentialActivities = credentials.map((item) => ({
    id: `credential-${item.credential_id}`,
    type: 'credential' as const,
    title: item.schema_id || 'Credential received',
    subtitle: item.attrs
      ? Object.entries(item.attrs)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : undefined,
    status: item.state,
    createdAt: item.created_at,
  }));

  const connectionActivities = connections.map((item) => ({
    id: `connection-${item.connection_id}`,
    type: 'connection' as const,
    title: item.their_label || 'New connection',
    subtitle: item.their_did,
    status: item.state,
    createdAt: item.created_at,
  }));

  const proofActivities = proofs.map((item) => ({
    id: `proof-${item.presentation_exchange_id}`,
    type: 'proof' as const,
    title: 'Proof request received',
    subtitle: Object.values(item.requested_attributes ?? {})
      .map((attribute) => attribute.name)
      .join(', '),
    status: item.state,
    createdAt: item.created_at,
  }));

  return [...credentialActivities, ...connectionActivities, ...proofActivities]
    .sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 7);
}

function summarizeStats(
  credentials: Credential[],
  connections: Connection[],
  proofs: ProofRequest[],
): AggregatedStats {
  return {
    totalCredentials: credentials.length,
    activeConnections: connections.filter((item) => item.state === 'active').length,
    pendingProofs: proofs.filter((item) => item.state?.includes('request')).length,
  };
}

export default function DashboardPage() {
  const { token } = useAuth();
  const { hasAnyRole } = useRoles();
  const [credentials, setCredentials] = React.useState<Credential[]>([]);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [proofs, setProofs] = React.useState<ProofRequest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadDashboardData = React.useCallback(async () => {
    if (!token) {
      setCredentials([]);
      setConnections([]);
      setProofs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [credData, connData, proofData] = await Promise.all([
        getCredentials(token),
        getConnections(token),
        getProofRequests(token),
      ]);
      setCredentials(credData ?? []);
      setConnections(connData ?? []);
      setProofs(proofData ?? []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      setError('Unable to load dashboard data right now.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const stats = React.useMemo(
    () => summarizeStats(credentials, connections, proofs),
    [credentials, connections, proofs],
  );

  const activities = React.useMemo(
    () => buildActivities(credentials, connections, proofs),
    [credentials, connections, proofs],
  );

  const connectionsInProgress = React.useMemo(
    () => connections.filter((item) => item.state !== 'active').length,
    [connections],
  );

  const canManageCoreResources = hasAnyRole(['holder', 'admin']);
  const isIssuer = hasAnyRole(['issuer', 'admin']);
  const isVerifier = hasAnyRole(['verifier', 'admin']);

  return (
    <RoleGuard allowedRoles={['holder', 'admin', 'issuer', 'verifier', 'viewer']}>
      <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credentials</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="animate-pulse">...</span> : stats.totalCredentials}
            </div>
            <p className="text-xs text-muted-foreground">Credentials stored in your wallet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="animate-pulse">...</span> : stats.activeConnections}
            </div>
            <p className="text-xs text-muted-foreground">Connections ready to exchange data</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Proof Requests</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="animate-pulse">...</span> : stats.pendingProofs}
            </div>
            <p className="text-xs text-muted-foreground">Proof requests awaiting action</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connections in Progress</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? <span className="animate-pulse">...</span> : connectionsInProgress}
            </div>
            <p className="text-xs text-muted-foreground">Invitations and requests awaiting approval</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent wallet events across credentials, connections, and proofs.
              </CardDescription>
            </div>
            <Button asChild size="sm" className="ml-auto gap-1" variant="outline">
              <Link href="/dashboard/notifications">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                Loading activity...
              </div>
            ) : activities.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                No recent activity yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">When</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <div className="font-medium">
                          {activity.type === 'credential' && 'Credential Issued'}
                          {activity.type === 'connection' && 'Connection Update'}
                          {activity.type === 'proof' && 'Proof Request'}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {activity.title}
                          {activity.subtitle ? ` • ${activity.subtitle}` : ''}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.status?.includes('request') ? 'outline' : 'secondary'}>
                          {activity.status || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Perform common tasks with a single click.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {canManageCoreResources && (
              <>
                <Button variant="default">
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard/credentials">
                    <Wallet className="mr-2 h-4 w-4" />
                    View All Credentials
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard/connections">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Connections
                  </Link>
                </Button>
              </>
            )}
            {isIssuer && (
              <>
                <Button variant="default" asChild>
                  <Link href="/dashboard/issuer">
                    <FileText className="mr-2 h-4 w-4" />
                    Issue Credential
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard/connections">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Connections
                  </Link>
                </Button>
              </>
            )}
            {isVerifier && (
              <>
                <Button variant="default" asChild>
                  <Link href="/dashboard/verifier">
                    <SearchCheck className="mr-2 h-4 w-4" />
                    Request Verification
                  </Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link href="/dashboard/proofs">
                    <Shield className="mr-2 h-4 w-4" />
                    View Proof Requests
                  </Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      </div>
    </RoleGuard>
  );
}
