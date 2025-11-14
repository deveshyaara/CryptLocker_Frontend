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

export default function VerifierPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleRequestProof = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate proof request
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: 'Proof request sent',
        description: 'The verification request has been sent to the holder.',
      });
    } catch (error) {
      toast({
        title: 'Failed to request proof',
        description: 'Please try again.',
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
                      <Label htmlFor="connection-id">Holder Connection ID</Label>
                      <Input
                        id="connection-id"
                        placeholder="Enter connection ID"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="proof-name">Proof Request Name</Label>
                      <Input
                        id="proof-name"
                        placeholder="e.g., Age Verification"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="requested-attrs">Requested Attributes (JSON)</Label>
                      <Textarea
                        id="requested-attrs"
                        placeholder='{"name": {"name": "name", "restrictions": []}, "age": {"name": "age", "restrictions": []}}'
                        rows={6}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="predicates">Predicates (Optional)</Label>
                      <Textarea
                        id="predicates"
                        placeholder='{"age": {"name": "age", "p_type": ">=", "p_value": 18}}'
                        rows={4}
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
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
