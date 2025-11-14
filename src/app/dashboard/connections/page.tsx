'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
    acceptConnectionInvitation,
    createConnectionInvitation,
    deleteConnection,
    getConnections,
} from '@/lib/api/holder';
import { ApiError } from '@/lib/api/http';
import type { Connection, ConnectionInvitation } from '@/types/api';
import {
    Copy,
    Link2,
    Loader2,
    PlusCircle,
    RefreshCw,
    Search,
    Trash2,
} from 'lucide-react';

function formatRelativeDate(date?: string) {
    if (!date) {
        return 'Unknown';
    }
    try {
        return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
        console.warn('Unable to format date', error);
        return 'Unknown';
    }
}

function getStatusVariant(state?: string) {
    const normalized = (state || '').toLowerCase();
    if (normalized.includes('active')) {
        return 'default';
    }
    if (normalized.includes('pending') || normalized.includes('request')) {
        return 'secondary';
    }
    if (normalized.includes('error')) {
        return 'destructive';
    }
    return 'outline';
}

export default function ConnectionsPage() {
    const { token } = useAuth();
    const { toast } = useToast();

    const [connections, setConnections] = React.useState<Connection[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [selectedConnection, setSelectedConnection] = React.useState<Connection | null>(null);
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const [creatingInvitation, setCreatingInvitation] = React.useState(false);
    const [createAlias, setCreateAlias] = React.useState('');
    const [multiUse, setMultiUse] = React.useState(false);
    const [createdInvitation, setCreatedInvitation] = React.useState<ConnectionInvitation | null>(null);

    const [acceptingInvitation, setAcceptingInvitation] = React.useState(false);
    const [invitationUrl, setInvitationUrl] = React.useState('');
    const [invitationJson, setInvitationJson] = React.useState('');

    const loadConnections = React.useCallback(async () => {
        if (!token) {
            setConnections([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const data = await getConnections(token);
            setConnections(data ?? []);
        } catch (err) {
            console.error('Failed to fetch connections', err);
            setError(err instanceof Error ? err.message : 'Unable to load connections');
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        void loadConnections();
    }, [loadConnections]);

    const filteredConnections = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return connections;
        }
        return connections.filter((item) => {
            const label = item.their_label?.toLowerCase() ?? '';
            const did = item.their_did?.toLowerCase() ?? '';
            return label.includes(query) || did.includes(query) || item.connection_id.toLowerCase().includes(query);
        });
    }, [connections, search]);

    const handleCopy = React.useCallback(async (value: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast({ description: 'Copied to clipboard.' });
        } catch (err) {
            console.error('Clipboard error', err);
            toast({ description: 'Unable to copy to clipboard.', variant: 'destructive' });
        }
    }, [toast]);

    const resetInvitationState = React.useCallback(() => {
        setCreatedInvitation(null);
        setCreateAlias('');
        setMultiUse(false);
        setInvitationUrl('');
        setInvitationJson('');
        setAcceptingInvitation(false);
        setCreatingInvitation(false);
    }, []);

    const handleCreateInvitation = React.useCallback(async () => {
        if (!token) {
            toast({ description: 'You must be logged in to create an invitation.', variant: 'destructive' });
            return;
        }

        try {
            setCreatingInvitation(true);
            const invitation = await createConnectionInvitation(token, {
                alias: createAlias || undefined,
                multi_use: multiUse,
                auto_accept: true,
            });
            setCreatedInvitation(invitation);
            toast({ description: 'Invitation created successfully.' });
            await loadConnections();
        } catch (err) {
            console.error('Failed to create invitation', err);
            const message = err instanceof ApiError ? err.message : 'Unable to create invitation.';
            toast({ description: message, variant: 'destructive' });
        } finally {
            setCreatingInvitation(false);
        }
    }, [token, createAlias, multiUse, loadConnections, toast]);

    const handleAcceptInvitation = React.useCallback(async () => {
        if (!token) {
            toast({ description: 'You must be logged in to accept an invitation.', variant: 'destructive' });
            return;
        }

        const payload: { invitation_url?: string; invitation?: Record<string, unknown>; auto_accept: boolean } = {
            auto_accept: true,
        };

        if (invitationUrl.trim()) {
            payload.invitation_url = invitationUrl.trim();
        }

        if (invitationJson.trim()) {
            try {
                payload.invitation = JSON.parse(invitationJson.trim()) as Record<string, unknown>;
            } catch (parseError) {
                toast({ description: 'Invitation JSON is not valid.', variant: 'destructive' });
                return;
            }
        }

        if (!payload.invitation_url && !payload.invitation) {
            toast({ description: 'Provide an invitation URL or JSON payload.', variant: 'destructive' });
            return;
        }

        try {
            setAcceptingInvitation(true);
            await acceptConnectionInvitation(token, payload);
            toast({ description: 'Connection invitation accepted.' });
            resetInvitationState();
            setIsDialogOpen(false);
            await loadConnections();
        } catch (err) {
            console.error('Failed to accept invitation', err);
            const message = err instanceof ApiError ? err.message : 'Unable to accept invitation.';
            toast({ description: message, variant: 'destructive' });
        } finally {
            setAcceptingInvitation(false);
        }
    }, [token, invitationUrl, invitationJson, toast, resetInvitationState, loadConnections]);

    const handleDeleteConnection = React.useCallback(
        async (connectionId: string) => {
            if (!token) {
                toast({ description: 'You must be logged in to remove a connection.', variant: 'destructive' });
                return;
            }

            try {
                await deleteConnection(token, connectionId);
                toast({ description: 'Connection removed.' });
                await loadConnections();
            } catch (err) {
                console.error('Failed to delete connection', err);
                const message = err instanceof ApiError ? err.message : 'Unable to remove connection.';
                toast({ description: message, variant: 'destructive' });
            }
        },
        [token, toast, loadConnections],
    );

    return (
        <div className="flex h-full flex-col">
            <header className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="font-headline text-3xl font-bold">My Connections</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage issuers and verifiers you trust. Create or accept invitations to connect instantly.
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void loadConnections()}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="sr-only">Refresh connections</span>
                    </Button>
                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) {
                            resetInvitationState();
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                <span>Add Connection</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>Add a new connection</DialogTitle>
                                <DialogDescription>
                                    Create an invitation to share with someone else or accept an invitation you received.
                                </DialogDescription>
                            </DialogHeader>
                            <Tabs defaultValue="create" className="mt-2">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="create">Create invitation</TabsTrigger>
                                    <TabsTrigger value="accept">Accept invitation</TabsTrigger>
                                </TabsList>
                                <TabsContent value="create" className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="connection-alias">Label (optional)</Label>
                                        <Input
                                            id="connection-alias"
                                            value={createAlias}
                                            onChange={(event) => setCreateAlias(event.target.value)}
                                            placeholder="e.g. Tech Corp HR"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between rounded-md border p-3">
                                        <div>
                                            <p className="text-sm font-medium">Allow multiple uses</p>
                                            <p className="text-xs text-muted-foreground">
                                                Enable if you plan to share the invitation with more than one organization.
                                            </p>
                                        </div>
                                        <Switch checked={multiUse} onCheckedChange={setMultiUse} aria-label="Toggle multi use" />
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => void handleCreateInvitation()}
                                        disabled={creatingInvitation}
                                    >
                                        {creatingInvitation ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <Link2 className="mr-2 h-4 w-4" />
                                        )}
                                        Generate invitation
                                    </Button>
                                    {createdInvitation ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-base">Share this invitation</CardTitle>
                                                <CardDescription>
                                                    Send the link below to the party you want to connect with.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs uppercase text-muted-foreground">Invitation URL</Label>
                                                    <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2 text-sm">
                                                        <span className="break-all">{createdInvitation.invitation_url}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => void handleCopy(createdInvitation.invitation_url)}
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                            <span className="sr-only">Copy invitation URL</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs uppercase text-muted-foreground">Invitation payload</Label>
                                                    <pre className="max-h-48 overflow-auto rounded-md bg-muted/40 p-3 text-xs">
{JSON.stringify(createdInvitation.invitation, null, 2)}
                                                    </pre>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ) : null}
                                </TabsContent>
                                <TabsContent value="accept" className="mt-4 space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="invitation-url">Invitation URL</Label>
                                        <Input
                                            id="invitation-url"
                                            placeholder="https://issuer.example/...?oob=..."
                                            value={invitationUrl}
                                            onChange={(event) => setInvitationUrl(event.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="invitation-json">Invitation JSON</Label>
                                        <Textarea
                                            id="invitation-json"
                                            placeholder='{"@type":"...","label":"Issuer"...}'
                                            value={invitationJson}
                                            onChange={(event) => setInvitationJson(event.target.value)}
                                            rows={6}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Paste the full JSON body if you received a QR code payload instead of a link.
                                        </p>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            className="w-full"
                                            onClick={() => void handleAcceptInvitation()}
                                            disabled={acceptingInvitation}
                                        >
                                            {acceptingInvitation ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <Link2 className="mr-2 h-4 w-4" />
                                            )}
                                            Accept invitation
                                        </Button>
                                    </DialogFooter>
                                </TabsContent>
                            </Tabs>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by label, DID, or connection ID..."
                        className="pl-8"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
            </div>

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Loading connections...
                </div>
            ) : filteredConnections.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    {connections.length === 0
                        ? 'No connections yet. Create or accept an invitation to get started.'
                        : 'No connections match your search.'}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredConnections.map((connection) => (
                        <Card key={connection.connection_id} className="flex flex-col justify-between">
                            <CardHeader className="space-y-2">
                                <CardTitle className="flex items-center justify-between">
                                    <span>{connection.their_label || 'Unnamed connection'}</span>
                                    <Badge variant={getStatusVariant(connection.state)}>{connection.state ?? 'Unknown'}</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Connection ID: <span className="font-mono text-xs">{connection.connection_id}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-muted-foreground">
                                <div className="flex items-center justify-between">
                                    <span>Established</span>
                                    <span>{formatRelativeDate(connection.created_at)}</span>
                                </div>
                                <div className="space-y-1">
                                    <p>Their DID</p>
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 truncate font-mono text-xs">{connection.their_did ?? '—'}</span>
                                        {connection.their_did ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => void handleCopy(connection.their_did!)}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span className="sr-only">Copy their DID</span>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p>My DID</p>
                                    <div className="flex items-center gap-2">
                                        <span className="flex-1 truncate font-mono text-xs">{connection.my_did ?? '—'}</span>
                                        {connection.my_did ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => void handleCopy(connection.my_did!)}
                                            >
                                                <Copy className="h-4 w-4" />
                                                <span className="sr-only">Copy my DID</span>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </CardContent>
                            <div className="flex items-center justify-between gap-2 border-t p-4">
                                <Dialog open={detailsOpen && selectedConnection?.connection_id === connection.connection_id} onOpenChange={(open) => {
                                    setSelectedConnection(open ? connection : null);
                                    setDetailsOpen(open);
                                }}>
                                    <DialogTrigger asChild>
                                        <Button variant="secondary" className="flex-1">View details</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Connection details</DialogTitle>
                                            <DialogDescription>
                                                Complete record for <span className="font-semibold">{connection.their_label || connection.connection_id}</span>
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 text-sm">
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">Connection ID</p>
                                                <p className="font-mono text-xs">{connection.connection_id}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">State</p>
                                                <Badge variant={getStatusVariant(connection.state)}>{connection.state ?? 'Unknown'}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">Their DID</p>
                                                <p className="font-mono text-xs break-all">{connection.their_did ?? 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">My DID</p>
                                                <p className="font-mono text-xs break-all">{connection.my_did ?? 'Not provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase text-muted-foreground">Created</p>
                                                <p>{connection.created_at ? new Date(connection.created_at).toLocaleString() : 'Unknown'}</p>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="icon">
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove connection</span>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remove this connection?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Disconnecting will revoke your secure channel with {connection.their_label || 'this party'}. You can reconnect later with a new invitation.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => void handleDeleteConnection(connection.connection_id)}>
                                                Remove connection
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
