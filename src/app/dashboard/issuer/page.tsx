'use client';

import * as React from 'react';
import { RoleGuard } from '@/components/common/role-guard';
import { FileUpload } from '@/components/common/file-upload';
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
import { issueCredential, getConnections } from '@/lib/api/holder';
import { ApiError } from '@/lib/api/http';
import type { Connection } from '@/types/api';

export default function IssuerPage() {
  const { token, service } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [connections, setConnections] = React.useState<Connection[]>([]);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [loadingConnections, setLoadingConnections] = React.useState(false);
  const [stats, setStats] = React.useState({
    credentialsIssued: 0,
    activeConnections: 0,
    pendingOffers: 0,
  });
  const [loadingStats, setLoadingStats] = React.useState(true);

  React.useEffect(() => {
    if (token) {
      loadConnections();
      loadStats();
    }
  }, [token]);

  const loadStats = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoadingStats(true);
      const response = await fetch('/api/db/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats', error);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  const loadConnections = React.useCallback(async () => {
    if (!token) return;
    try {
      setLoadingConnections(true);
      const data = await getConnections(token, 'issuer');
      setConnections(data.filter((c) => c.state === 'active'));
    } catch (error) {
      console.error('Failed to load connections', error);
    } finally {
      setLoadingConnections(false);
    }
  }, [token]);

  const handleIssueCredential = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to issue credentials.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData(event.currentTarget);
      const connectionId = String(formData.get('connection-id') ?? '').trim();
      const schemaId = String(formData.get('schema-id') ?? '').trim();
      const credDefId = String(formData.get('cred-def-id') ?? '').trim();
      const attributesJson = String(formData.get('attributes') ?? '{}').trim();
      const comment = String(formData.get('comment') ?? '').trim();

      if (!connectionId || !schemaId || !attributesJson) {
        toast({
          title: 'Missing required fields',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }

      let attributes: Record<string, string>;
      try {
        attributes = JSON.parse(attributesJson);
      } catch {
        toast({
          title: 'Invalid JSON',
          description: 'Attributes must be valid JSON format.',
          variant: 'destructive',
        });
        return;
      }

      // If file is uploaded, read it and add to attributes
      if (selectedFile) {
        try {
          const fileContent = await selectedFile.text();
          
          // Try to parse as JSON first
          try {
            const fileData = JSON.parse(fileContent);
            // Merge JSON data into attributes
            attributes = { ...attributes, ...fileData };
            toast({
              title: 'File processed',
              description: 'Document content has been added to credential attributes.',
            });
          } catch {
            // If not JSON, add as text content
            // Truncate if too long (credentials have size limits)
            const maxLength = 10000;
            if (fileContent.length > maxLength) {
              toast({
                title: 'File content truncated',
                description: `File content was too long and has been truncated to ${maxLength} characters.`,
                variant: 'default',
              });
              attributes['document_content'] = fileContent.substring(0, maxLength);
            } else {
              attributes['document_content'] = fileContent;
            }
            attributes['document_name'] = selectedFile.name;
            attributes['document_size'] = selectedFile.size.toString();
          }
        } catch (fileError) {
          console.error('Error reading file:', fileError);
          toast({
            title: 'File read error',
            description: 'Could not read the uploaded file. Proceeding without file content.',
            variant: 'destructive',
          });
        }
      }

      await issueCredential(
        token,
        {
          connection_id: connectionId,
          schema_id: schemaId,
          cred_def_id: credDefId || undefined,
          attributes,
          comment: comment || undefined,
        },
        'issuer',
      );

      toast({
        title: 'Credential offer sent',
        description: 'The credential offer has been sent to the holder.',
      });

      // Save file to database if uploaded
      if (selectedFile && token) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          formData.append('credentialId', ''); // Will be set after credential creation
          
          await fetch('/api/db/upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            body: formData,
          });
        } catch (fileError) {
          console.error('Failed to save file to database:', fileError);
        }
      }

      // Reset form
      event.currentTarget.reset();
      setSelectedFile(null);
      await loadStats(); // Refresh stats
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Failed to issue credential. Please try again.';
      toast({
        title: 'Failed to issue credential',
        description: message,
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
              {loadingStats ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{stats.credentialsIssued}</div>
              )}
              <p className="text-xs text-muted-foreground">Total issued</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{stats.activeConnections}</div>
              )}
              <p className="text-xs text-muted-foreground">Connected holders</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="text-2xl font-bold">...</div>
              ) : (
                <div className="text-2xl font-bold">{stats.pendingOffers}</div>
              )}
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
                      <Label htmlFor="schema-id">Schema ID</Label>
                      <Input
                        id="schema-id"
                        name="schema-id"
                        placeholder="Enter schema identifier"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cred-def-id">Credential Definition ID (Optional)</Label>
                      <Input
                        id="cred-def-id"
                        name="cred-def-id"
                        placeholder="Enter credential definition ID"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="attributes">Attributes (JSON)</Label>
                      <Textarea
                        id="attributes"
                        name="attributes"
                        placeholder='{"name": "John Doe", "degree": "Computer Science"}'
                        rows={6}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <FileUpload
                        label="Upload Document (Optional)"
                        accept=".json,.txt,.pdf"
                        maxSize={5}
                        onFileSelect={setSelectedFile}
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
