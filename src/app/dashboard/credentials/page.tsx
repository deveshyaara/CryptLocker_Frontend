'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RoleGuard } from '@/components/common/role-guard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { useRoles } from '@/hooks/use-roles';
import { useToast } from '@/hooks/use-toast';
import {
    acceptCredentialOffer,
    deleteCredential,
    getCredential,
    getCredentialOffers,
    getCredentials,
} from '@/lib/api/holder';
import { ApiError } from '@/lib/api/http';
import { API_BASE_URLS } from '@/lib/api/config';
import type { Credential, CredentialOffer } from '@/types/api';
import {
    CheckCircle2,
    ClipboardCopy,
    FileType,
    Loader2,
    PlusCircle,
    RefreshCw,
    Search,
    Trash2,
    Upload,
} from 'lucide-react';
import { FileUpload } from '@/components/common/file-upload';

function summarizeStatus(state?: string) {
    if (!state) {
        return 'Unknown';
    }
    const normalized = state.toLowerCase();
    if (normalized.includes('cred-received') || normalized.includes('stored') || normalized.includes('issued')) {
        return 'Active';
    }
    if (normalized.includes('offer')) {
        return 'Offer';
    }
    if (normalized.includes('request')) {
        return 'Pending';
    }
    if (normalized.includes('revoked')) {
        return 'Revoked';
    }
    return state;
}

function getStatusBadgeVariant(status: string) {
    const normalized = status.toLowerCase();
    if (normalized === 'active') {
        return 'default' as const;
    }
    if (normalized === 'offer' || normalized === 'pending') {
        return 'secondary' as const;
    }
    if (normalized === 'revoked' || normalized === 'expired') {
        return 'destructive' as const;
    }
    return 'outline' as const;
}

export default function CredentialsPage() {
    const { token, service } = useAuth();
    const { hasAnyRole } = useRoles();
    const { toast } = useToast();

    const [credentials, setCredentials] = React.useState<Credential[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isRefreshing, setIsRefreshing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [search, setSearch] = React.useState('');
    const [selectedCredential, setSelectedCredential] = React.useState<Credential | null>(null);
    const [detailsOpen, setDetailsOpen] = React.useState(false);

    const [offers, setOffers] = React.useState<CredentialOffer[]>([]);
    const [offersLoading, setOffersLoading] = React.useState(false);
    const [offersError, setOffersError] = React.useState<string | null>(null);
    const [offersSupported, setOffersSupported] = React.useState(true);
    const [acceptingOfferId, setAcceptingOfferId] = React.useState<string | null>(null);
    const [offersDialogOpen, setOffersDialogOpen] = React.useState(false);
    const [uploadedFile, setUploadedFile] = React.useState<File | null>(null);
    const [uploadingFile, setUploadingFile] = React.useState(false);

    const credentialsRequestRef = React.useRef(false);

    const loadCredentials = React.useCallback(
        async ({ silent = false }: { silent?: boolean } = {}) => {
            if (!token) {
                setCredentials([]);
                setError(null);
                if (silent) {
                    setIsRefreshing(false);
                } else {
                    setLoading(false);
                }
                return;
            }

            if (credentialsRequestRef.current) {
                return;
            }

            credentialsRequestRef.current = true;
            if (silent) {
                setIsRefreshing(true);
            } else {
                setLoading(true);
            }

            try {
                setError(null);
                const data = await getCredentials(token, service);
                setCredentials(data ?? []);
            } catch (err) {
                console.error('Failed to fetch credentials', err);
                setError(err instanceof Error ? err.message : 'Unable to load credentials');
            } finally {
                credentialsRequestRef.current = false;
                if (silent) {
                    setIsRefreshing(false);
                } else {
                    setLoading(false);
                }
            }
        },
        [token, service],
    );

    React.useEffect(() => {
        void loadCredentials();
    }, [loadCredentials]);

    React.useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const refreshIfVisible = () => {
            if (document.visibilityState === 'visible') {
                void loadCredentials({ silent: true });
            }
        };

        const intervalId = window.setInterval(refreshIfVisible, 15000);
        window.addEventListener('focus', refreshIfVisible);
        document.addEventListener('visibilitychange', refreshIfVisible);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener('focus', refreshIfVisible);
            document.removeEventListener('visibilitychange', refreshIfVisible);
        };
    }, [loadCredentials]);

    const loadOffers = React.useCallback(async () => {
        if (!token) {
            setOffers([]);
            return;
        }
        try {
            setOffersLoading(true);
            setOffersError(null);
            const data = await getCredentialOffers(token, service);
            setOffers(data ?? []);
            setOffersSupported(true);
        } catch (err) {
            console.error('Failed to fetch credential offers', err);
            if (err instanceof ApiError && err.status === 404) {
                setOffersSupported(false);
                setOffersError('Credential offers are not enabled on the holder API.');
            } else {
                setOffersError(err instanceof Error ? err.message : 'Unable to load credential offers');
            }
        } finally {
            setOffersLoading(false);
        }
    }, [token, service]);

    const filteredCredentials = React.useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return credentials;
        }
        return credentials.filter((credential) => {
            const schema = credential.schema_id?.toLowerCase() ?? '';
            const state = credential.state?.toLowerCase() ?? '';
            const connection = credential.connection_id?.toLowerCase() ?? '';
            const attrs = credential.attrs ? Object.values(credential.attrs).join(' ').toLowerCase() : '';
            return (
                schema.includes(query) ||
                state.includes(query) ||
                connection.includes(query) ||
                (credential.credential_id?.toLowerCase().includes(query) ?? false) ||
                attrs.includes(query)
            );
        });
    }, [credentials, search]);

    const handleDeleteCredential = React.useCallback(
        async (credentialId: string) => {
            if (!token) {
                toast({ description: 'You must be logged in to remove a credential.', variant: 'destructive' });
                return;
            }

            if (!hasAnyRole(['holder', 'admin'])) {
                toast({ description: 'You do not have permission to remove credentials.', variant: 'destructive' });
                return;
            }
            try {
                await deleteCredential(token, credentialId, service);
                toast({ description: 'Credential deleted.' });
                await loadCredentials({ silent: true });
            } catch (err) {
                console.error('Failed to delete credential', err);
                const message = err instanceof ApiError ? err.message : 'Unable to delete credential.';
                toast({ description: message, variant: 'destructive' });
            }
        },
        [token, service, toast, loadCredentials, hasAnyRole],
    );

    const openCredentialDetails = React.useCallback(
        async (credential: Credential) => {
            if (!token) {
                setSelectedCredential(credential);
                setDetailsOpen(true);
                return;
            }

            try {
                const detailed = await getCredential(token, credential.credential_id, service);
                setSelectedCredential(detailed ?? credential);
            } catch (err) {
                console.warn('Unable to fetch credential details', err);
                setSelectedCredential(credential);
            } finally {
                setDetailsOpen(true);
            }
        },
        [token, service],
    );

    const handleAcceptOffer = React.useCallback(
        async (offerId: string) => {
            if (!token) {
                toast({ description: 'You must be logged in to accept credential offers.', variant: 'destructive' });
                return;
            }

            if (!hasAnyRole(['holder', 'admin'])) {
                toast({ description: 'You do not have permission to accept credential offers.', variant: 'destructive' });
                return;
            }
            try {
                setAcceptingOfferId(offerId);
                await acceptCredentialOffer(token, offerId, service);
                toast({ description: 'Credential offer accepted.' });
                await loadCredentials({ silent: true });
                await loadOffers();
            } catch (err) {
                console.error('Failed to accept credential offer', err);
                const message = err instanceof ApiError ? err.message : 'Unable to accept offer.';
                toast({ description: message, variant: 'destructive' });
            } finally {
                setAcceptingOfferId(null);
            }
        },
        [token, service, toast, loadCredentials, loadOffers, hasAnyRole],
    );

    const issuerConsoleUrl = React.useMemo(() => API_BASE_URLS.issuer, []);
    const canManageCredentials = hasAnyRole(['holder', 'admin']);

    return (
        <RoleGuard allowedRoles={['holder', 'admin']}>
            <div className="flex h-full flex-col">
            <header className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="font-headline text-3xl font-bold">My Credentials</h1>
                    <p className="text-sm text-muted-foreground">
                        Review credentials stored in your wallet, inspect their attributes, and manage pending offers.
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void loadCredentials()}
                        disabled={loading || isRefreshing}
                    >
                        {loading || isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="sr-only">Refresh credentials</span>
                    </Button>
                    <Dialog
                        open={offersDialogOpen}
                        onOpenChange={(open) => {
                            setOffersDialogOpen(open);
                            if (open) {
                                void loadOffers();
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="gap-1">
                                <PlusCircle className="h-4 w-4" />
                                <span>Add Credential</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Add a credential to your wallet</DialogTitle>
                                <DialogDescription>
                                    Accept a pending credential offer or request a new one from a trusted issuer.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex-1 overflow-y-auto min-h-0">
                            <Tabs defaultValue="offers" className="mt-2">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="offers">Pending offers</TabsTrigger>
                                    <TabsTrigger value="issuer">Request from issuer</TabsTrigger>
                                </TabsList>
                                <TabsContent value="offers" className="mt-4 space-y-4">
                                    {offersLoading ? (
                                        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading offers...
                                        </div>
                                    ) : offersError ? (
                                        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                                            {offersError}
                                        </div>
                                    ) : offers.length === 0 ? (
                                        <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                                            You do not have any pending offers right now. Ask an issuer to send you one, then refresh this list.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {offers.map((offer) => {
                                                const statusLabel = summarizeStatus(offer.state);
                                                return (
                                                    <Card key={offer.credential_exchange_id}>
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <CardTitle className="text-base font-semibold">
                                                                    {offer.comment || offer.schema_id || 'Credential offer'}
                                                                </CardTitle>
                                                                <Badge variant={getStatusBadgeVariant(statusLabel)}>{statusLabel}</Badge>
                                                            </div>
                                                            <CardDescription>
                                                                Offer ID: <span className="font-mono text-xs">{offer.credential_exchange_id}</span>
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="space-y-2 text-sm text-muted-foreground">
                                                            <div className="flex items-center justify-between">
                                                                <span>From</span>
                                                                <span>{offer.issuer || offer.connection_id || 'Unknown issuer'}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span>Received</span>
                                                                <span>{offer.created_at ? formatDistanceToNow(new Date(offer.created_at), { addSuffix: true }) : 'Unknown'}</span>
                                                            </div>
                                                            {offer.attributes ? (
                                                                <div>
                                                                    <p className="text-xs uppercase text-muted-foreground">Attributes</p>
                                                                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                                                        {Object.entries(offer.attributes).map(([key, value]) => (
                                                                            <div key={key} className="rounded-md bg-muted/40 p-2">
                                                                                <p className="font-medium text-foreground">{key}</p>
                                                                                <p className="text-muted-foreground">{value}</p>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </CardContent>
                                                        <CardFooter>
                                                            <Button
                                                                className="w-full"
                                                                onClick={() => void handleAcceptOffer(offer.credential_exchange_id)}
                                                                disabled={
                                                                    acceptingOfferId === offer.credential_exchange_id ||
                                                                    !canManageCredentials
                                                                }
                                                            >
                                                                {acceptingOfferId === offer.credential_exchange_id ? (
                                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                )}
                                                                Accept offer
                                                            </Button>
                                                        </CardFooter>
                                                    </Card>
                                                );
                                            })}
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="issuer" className="mt-4 space-y-4">
                                    <div className="space-y-4">
                                        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                                            <p className="mb-2 font-medium text-foreground">Upload Document for Credential</p>
                                            <p className="mb-3">
                                                Upload a document that will be associated with your credential. The document will be stored securely in the database.
                                            </p>
                                        </div>
                                        
                                        <FileUpload
                                            label="Upload Document"
                                            accept=".pdf,.txt,.json,.doc,.docx,.jpg,.png"
                                            maxSize={10}
                                            onFileSelect={setUploadedFile}
                                        />

                                        {uploadedFile && (
                                            <div className="space-y-2">
                                                <Button
                                                    className="w-full"
                                                    onClick={async () => {
                                                        if (!token || !uploadedFile) return;
                                                        
                                                        setUploadingFile(true);
                                                        try {
                                                            const formData = new FormData();
                                                            formData.append('file', uploadedFile);
                                                            
                                                            const response = await fetch('/api/db/upload', {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`,
                                                                },
                                                                body: formData,
                                                            });
                                                            
                                                            if (!response.ok) {
                                                                throw new Error('Upload failed');
                                                            }
                                                            
                                                            const result = await response.json();
                                                            toast({
                                                                title: 'File uploaded successfully',
                                                                description: 'Your document has been saved to the database.',
                                                            });
                                                            setUploadedFile(null);
                                                        } catch (error) {
                                                            toast({
                                                                title: 'Upload failed',
                                                                description: error instanceof Error ? error.message : 'Could not upload file',
                                                                variant: 'destructive',
                                                            });
                                                        } finally {
                                                            setUploadingFile(false);
                                                        }
                                                    }}
                                                    disabled={uploadingFile}
                                                >
                                                    {uploadingFile ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                            Uploading...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="mr-2 h-4 w-4" />
                                                            Save Document to Database
                                                        </>
                                                    )}
                                                </Button>
                                            </div>
                                        )}

                                        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                                            <p className="mb-2 font-medium text-foreground">Or Request from Issuer</p>
                                            <p>
                                                Visit your issuer&apos;s portal to request an offer, then return here to accept it.
                                                If you&apos;re testing locally, you can open the issuer sandbox:
                                            </p>
                                            <div className="mt-3 flex items-center gap-2 text-xs">
                                                <Input value={issuerConsoleUrl} readOnly className="font-mono" />
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        void navigator.clipboard.writeText(issuerConsoleUrl);
                                                        toast({ description: 'Issuer URL copied to clipboard.' });
                                                    }}
                                                >
                                                    <ClipboardCopy className="mr-2 h-4 w-4" /> Copy URL
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" onClick={() => void loadOffers()} disabled={offersLoading}>
                                        {offersLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                                        Refresh offers
                                    </Button>
                                </TabsContent>
                            </Tabs>
                            </div>
                            <DialogFooter className="mt-4">
                                <Button variant="ghost" onClick={() => setOffersDialogOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by schema, issuer, state, or attribute..."
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
                    Loading credentials...
                </div>
            ) : filteredCredentials.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    {credentials.length === 0
                        ? 'No credentials yet. Request one from an issuer, then accept it here.'
                        : 'No credentials match your search.'}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredCredentials.map((credential) => {
                        const statusLabel = summarizeStatus(credential.state);
                        return (
                            <Card key={credential.credential_id} className="flex flex-col justify-between">
                                <CardHeader className="space-y-2">
                                    <CardTitle className="flex items-center justify-between text-lg">
                                        <span>{credential.schema_id || 'Credential'}</span>
                                        <Badge variant={getStatusBadgeVariant(statusLabel)}>{statusLabel}</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Credential ID: <span className="font-mono text-xs">{credential.credential_id}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <span>Connection</span>
                                        <span>{credential.connection_id || '—'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Received</span>
                                        <span>
                                            {credential.created_at
                                                ? formatDistanceToNow(new Date(credential.created_at), { addSuffix: true })
                                                : 'Unknown'}
                                        </span>
                                    </div>
                                    {credential.attrs ? (
                                        <div>
                                            <p className="text-xs uppercase text-muted-foreground">Attributes</p>
                                            <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                                                {Object.entries(credential.attrs).slice(0, 4).map(([key, value]) => (
                                                    <div key={key} className="rounded-md bg-muted/40 p-2">
                                                        <p className="font-medium text-foreground">{key}</p>
                                                        <p className="text-muted-foreground">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            {Object.keys(credential.attrs).length > 4 ? (
                                                <p className="mt-2 text-xs text-muted-foreground">
                                                    +{Object.keys(credential.attrs).length - 4} more attributes
                                                </p>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </CardContent>
                                <CardFooter className="flex items-center gap-2 border-t p-4">
                                    <Button variant="secondary" className="flex-1" onClick={() => void openCredentialDetails(credential)}>
                                        View details
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="icon" disabled={!canManageCredentials}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">Delete credential</span>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete this credential?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This cannot be undone. You can reaccept the offer from the issuer if you still have access to it.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => void handleDeleteCredential(credential.credential_id)}
                                                    disabled={!canManageCredentials}
                                                >
                                                    Delete credential
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Credential details</DialogTitle>
                        <DialogDescription>
                            Complete information for credential{' '}
                            <span className="font-semibold">{selectedCredential?.credential_id ?? 'Unknown'}</span>
                        </DialogDescription>
                    </DialogHeader>
                    {selectedCredential ? (
                        <ScrollArea className="max-h-[24rem] pr-4">
                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Schema</p>
                                    <p>{selectedCredential.schema_id || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Credential definition</p>
                                    <p>{selectedCredential.cred_def_id || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">State</p>
                                    <Badge variant={getStatusBadgeVariant(summarizeStatus(selectedCredential.state))}>
                                        {summarizeStatus(selectedCredential.state)}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Connection ID</p>
                                    <p className="font-mono text-xs">{selectedCredential.connection_id || 'Not provided'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-muted-foreground">Created</p>
                                    <p>{selectedCredential.created_at ? new Date(selectedCredential.created_at).toLocaleString() : 'Unknown'}</p>
                                </div>
                                {selectedCredential.attrs ? (
                                    <div>
                                        <p className="text-xs uppercase text-muted-foreground">Attributes</p>
                                        <div className="mt-2 grid gap-3">
                                            {Object.entries(selectedCredential.attrs).map(([key, value]) => (
                                                <div key={key} className="rounded-md border p-3">
                                                    <p className="text-xs uppercase text-muted-foreground">{key}</p>
                                                    <p className="text-sm text-foreground">{value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="py-12 text-center text-sm text-muted-foreground">No credential selected.</div>
                    )}
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
        </RoleGuard>
    );
}
