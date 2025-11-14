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
import { FileText, Send, Users } from 'lucide-react';

export default function IssuerPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleIssueCredential = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate credential issuance
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: 'Credential offer sent',
        description: 'The credential offer has been sent to the holder.',
      });
    } catch (error) {
      toast({
        title: 'Failed to issue credential',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['issuer', 'admin']}>
      <div className="flex h-full flex-col gap-6">
        <header>
          <h1 className="font-headline text-3xl font-bold">Issuer Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Issue and manage verifiable credentials for your organization
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credentials Issued</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">245</div>
              <p className="text-xs text-muted-foreground">+12 this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">Connected holders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">Awaiting acceptance</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="issue" className="flex-1">
          <TabsList>
            <TabsTrigger value="issue">Issue Credential</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">Issuance History</TabsTrigger>
          </TabsList>

          <TabsContent value="issue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Issue New Credential</CardTitle>
                <CardDescription>
                  Create and send a credential offer to a holder
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleIssueCredential} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="holder-id">Holder Connection ID</Label>
                      <Input
                        id="holder-id"
                        placeholder="Enter connection ID"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cred-type">Credential Type</Label>
                      <Input
                        id="cred-type"
                        placeholder="e.g., University Degree"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="schema-id">Schema ID</Label>
                      <Input
                        id="schema-id"
                        placeholder="Enter schema identifier"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="attributes">Attributes (JSON)</Label>
                      <Textarea
                        id="attributes"
                        placeholder='{"name": "John Doe", "degree": "Computer Science"}'
                        rows={6}
                        required
                      />
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending offer...' : 'Issue Credential'}
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
                  <CardTitle className="text-base">University Degree</CardTitle>
                  <CardDescription>Standard degree credential template</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>Education</Badge>
                    <p className="text-xs text-muted-foreground">
                      Attributes: name, degree, graduation_date, gpa
                    </p>
                    <Button size="sm" variant="outline" className="w-full">Use Template</Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Employment Certificate</CardTitle>
                  <CardDescription>Work experience verification</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge>Employment</Badge>
                    <p className="text-xs text-muted-foreground">
                      Attributes: name, position, start_date, end_date
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
                <CardTitle>Recent Issuances</CardTitle>
                <CardDescription>View your credential issuance history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground text-center py-8">
                  No issuance history available yet
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  );
}
