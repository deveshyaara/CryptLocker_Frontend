'use client';

import * as React from 'react';
import { RoleGuard } from '@/components/common/role-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, ShieldCheck } from 'lucide-react';
import { requestProof, getConnections } from '@/lib/api/holder';
import { ApiError } from '@/lib/api/http';
import type { Connection } from '@/types/api';

export default function VerifierPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [loadingConnections, setLoadingConnections] = React.useState(false);

  React.useEffect(() => {
    if (token) {
      loadConnections();
    }
  }, [token]);

  const loadConnections = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoadingConnections(true);
      const data = await getConnections(token, 'verifier');
      setConnections(data.filter((c) => c.state === 'active'));
    } catch (error) {
      console.error('Failed to load connections', error);
    } finally {
      setLoadingConnections(false);
    }
  }, [token]);

  const handleRequestProof = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to request proofs.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const connectionId = String(formData.get('connection-id') ?? '').trim();
      const requestedAttrsJson = String(formData.get('requested-attrs') ?? '{}').trim();
      const predicatesJson = String(formData.get('predicates') ?? '{}').trim();
      const comment = String(formData.get('comment') ?? '').trim();

      if (!connectionId || !requestedAttrsJson) {
        toast({
          title: 'Missing required fields',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      let requestedAttributes: Record<string, { name: string; restrictions?: unknown[] }>;
      try {
        requestedAttributes = JSON.parse(requestedAttrsJson);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Requested attributes must be valid JSON format.',
          variant: 'destructive',
        });
        return;
      }

      let requestedPredicates: Record<string, { name: string; p_type: string; p_value: number; restrictions?: unknown[] }> | undefined;
      if (predicatesJson) {
        try {
          requestedPredicates = JSON.parse(predicatesJson);
        } catch {
          toast({
            title: 'Invalid JSON',
            description: 'Predicates must be valid JSON format.',
            variant: 'destructive',
          });
          return;
        }
      }

      await requestProof(
        token,
        {
          connection_id: connectionId,
          requested_attributes: requestedAttributes,
          requested_predicates: requestedPredicates,
          comment: comment || undefined,
        },
        'verifier',
      );

      toast({
        title: 'Proof request sent',
        description: 'The verification request has been sent to the holder.',
      });

      // Reset form
      event.currentTarget.reset();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to request proof. Please try again.';
      toast({
        title: 'Failed to request proof',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['verifier', 'admin']}>
      <div className="flex h-full flex-col gap-6">
        <header>
          <h1 className="font-headline text-3xl font-bold">Verifier Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Request and verify credentials from holders
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">Successfully verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Verification failed</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">176</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="request" className="flex-1">
          <TabsList>
            <TabsTrigger value="request">Request Proof</TabsTrigger>
            <TabsTrigger value="templates">Verification Templates</TabsTrigger>
            <TabsTrigger value="history">Verification History</TabsTrigger>
          </TabsList>

          <TabsContent value="request" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Request Proof</CardTitle>
                <CardDescription>
                  Send a verification request to a credential holder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRequestProof} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="connection-id">Holder Connection</Label>
                      {loadingConnections ? (
                        <Input disabled placeholder="Loading connections..." />
                      ) : (
                        <select
                          id="connection-id"
                          name="connection-id"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          required
                        >
                          <option value="">Select a connection</option>
                          {connections.map((conn) => (
                            <option key={conn.connection_id} value={conn.connection_id}>
                              {conn.their_label || conn.connection_id}
                            </option>
                          ))}
                        </select>
                      )}
                      {connections.length === 0 && !loadingConnections && (
                        <p className="text-xs text-muted-foreground">
                          No active connections. Create a connection first.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="requested-attrs">Requested Attributes (JSON)</Label>
                      <Textarea
                        id="requested-attrs"
                        name="requested-attrs"
                        placeholder='{"name": {"name": "name", "restrictions": []}, "age": {"name": "age", "restrictions": []}}'
                        rows={6}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="predicates">Predicates (Optional)</Label>
                      <Textarea
                        id="predicates"
                        name="predicates"
                        placeholder='{"age": {"name": "age", "p_type": ">=", "p_value": 18}}'
                        rows={4}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="comment">Comment (Optional)</Label>
                      <Input
                        id="comment"
                        name="comment"
                        placeholder="Add a comment for the holder"
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting || !token}>
                      {isSubmitting ? 'Sending request...' : 'Request Proof'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Age Verification</CardTitle>
                  <CardDescription>Verify age is 18 or older</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>Identity</Badge>
                    <p className="text-xs text-muted-foreground">
                      Predicates: age &gt;= 18
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Employment Verification</CardTitle>
                  <CardDescription>Verify employment status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>Employment</Badge>
                    <p className="text-xs text-muted-foreground">
                      Attributes: employer, position, start_date
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Education Verification</CardTitle>
                  <CardDescription>Verify educational credentials</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>Education</Badge>
                    <p className="text-xs text-muted-foreground">
                      Attributes: degree, institution, graduation_date
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verification History</CardTitle>
                <CardDescription>View past verification requests and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-8">
                  No verification history available yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
