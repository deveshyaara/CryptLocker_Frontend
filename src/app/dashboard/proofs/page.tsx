'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
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
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getProofRequests, sendProofPresentation } from '@/lib/api/holder';
import { ApiError } from '@/lib/api/http';
import type { ProofRequest } from '@/types/api';
import {
    ClipboardList,
    FileCheck2,
    Loader2,
    RefreshCw,
    ShieldAlert,
} from 'lucide-react';

function formatState(state: string) {
    const normalized = state.toLowerCase();
    if (normalized.includes('request')) {
        return 'Request';
    }
    if (normalized.includes('presentation')) {
        return 'Presented';
    }
    if (normalized.includes('verify')) {
        return 'Verified';
    }
    return state;
}

function getStateVariant(state: string) {
    const normalized = state.toLowerCase();
    if (normalized.includes('verify') || normalized.includes('complete')) {
        return 'default' as const;
    }
    if (normalized.includes('presentation') || normalized.includes('request')) {
        return 'secondary' as const;
    }
    if (normalized.includes('declined') || normalized.includes('error')) {
        return 'destructive' as const;
    }
    return 'outline' as const;
}

export default function ProofsPage() {
    const { token } = useAuth();
    const { toast } = useToast();

    const [proofs, setProofs] = React.useState<ProofRequest[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [selectedProof, setSelectedProof] = React.useState<ProofRequest | null>(null);
    const [detailsOpen, setDetailsOpen] = React.useState(false);
    const [presentingId, setPresentingId] = React.useState<string | null>(null);

    const loadProofs = React.useCallback(async () => {
        if (!token) {
            setProofs([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const data = await getProofRequests(token);
            setProofs(data ?? []);
        } catch (err) {
            console.error('Failed to fetch proof requests', err);
            setError(err instanceof Error ? err.message : 'Unable to load proof requests');
        } finally {
            setLoading(false);
        }
    }, [token]);

    React.useEffect(() => {
        void loadProofs();
    }, [loadProofs]);

    const handlePresentProof = React.useCallback(
        async (proofId: string) => {
            if (!token) {
                toast({ description: 'You must be logged in to respond to proof requests.', variant: 'destructive' });
                return;
            }
            try {
                setPresentingId(proofId);
                await sendProofPresentation(token, proofId, {
                    requested_attributes: {},
                    requested_predicates: {},
                    self_attested_attributes: {},
                });
                toast({ description: 'Proof presentation submitted.' });
                await loadProofs();
            } catch (err) {
                console.error('Failed to present proof', err);
                const message = err instanceof ApiError ? err.message : 'Unable to present proof.';
                toast({ description: message, variant: 'destructive' });
            } finally {
                setPresentingId(null);
            }
        },
        [token, toast, loadProofs],
    );

    return (
        <div className="flex h-full flex-col">
            <header className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Proof Requests</h1>
                    <p className="text-sm text-muted-foreground">
                        Review incoming proof requests and share the required information securely with verifiers.
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void loadProofs()}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="sr-only">Refresh proofs</span>
                    </Button>
                </div>
            </header>

            {error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {loading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                    Loading proof requests...
                </div>
            ) : proofs.length === 0 ? (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                        <ShieldAlert className="h-10 w-10" />
                        <p className="text-base font-medium text-foreground">No pending proof requests</p>
                        <p className="max-w-md text-sm text-muted-foreground">
                            When a verifier asks for proof, it will appear here. You can respond instantly once you have the required credential.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                    {proofs.map((proof) => {
                        const stateLabel = formatState(proof.state);
                        return (
                            <Card key={proof.presentation_exchange_id} className="flex flex-col justify-between">
                                <CardHeader className="space-y-2">
                                    <CardTitle className="flex items-center justify-between text-lg">
                                        <span>Proof request</span>
                                        <Badge variant={getStateVariant(proof.state)}>{stateLabel}</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        Request ID: <span className="font-mono text-xs">{proof.presentation_exchange_id}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-muted-foreground">
                                    <div className="flex items-center justify-between">
                                        <span>Connection</span>
                                        <span>{proof.connection_id || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Requested on</span>
                                        <span>
                                            {proof.created_at
                                                ? formatDistanceToNow(new Date(proof.created_at), { addSuffix: true })
                                                : 'Unknown'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase text-muted-foreground">Requested attributes</p>
                                        <ul className="mt-2 space-y-1 text-xs">
                                            {Object.values(proof.requested_attributes ?? {}).map((attribute, index) => (
                                                <li key={`${attribute.name}-${index}`} className="flex items-center gap-2">
                                                    <ClipboardList className="h-3 w-3 text-primary" />
                                                    <span>{attribute.name}</span>
                                                </li>
                                            ))}
                                            {Object.keys(proof.requested_attributes ?? {}).length === 0 ? (
                                                <li className="text-muted-foreground">No specific attributes requested.</li>
                                            ) : null}
                                        </ul>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex items-center gap-2 border-t p-4">
                                    <Dialog open={detailsOpen && selectedProof?.presentation_exchange_id === proof.presentation_exchange_id} onOpenChange={(open) => {
                                        setSelectedProof(open ? proof : null);
                                        setDetailsOpen(open);
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="secondary" className="flex-1">
                                                View details
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>Proof request details</DialogTitle>
                                                <DialogDescription>
                                                    Requested data for connection <span className="font-semibold">{proof.connection_id || 'Unknown'}</span>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 text-sm">
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">State</p>
                                                    <Badge variant={getStateVariant(proof.state)}>{stateLabel}</Badge>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Requested attributes</p>
                                                    <div className="mt-2 space-y-2">
                                                        {Object.entries(proof.requested_attributes ?? {}).map(([key, attribute]) => (
                                                            <div key={key} className="rounded-md border p-3">
                                                                <p className="text-xs uppercase text-muted-foreground">{attribute.name}</p>
                                                                {attribute.restrictions?.length ? (
                                                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                                                        {attribute.restrictions.map((restriction, index) => (
                                                                            <li key={index}>{JSON.stringify(restriction)}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground">No restrictions</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {Object.keys(proof.requested_attributes ?? {}).length === 0 ? (
                                                            <p className="text-xs text-muted-foreground">No attribute information provided.</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <Separator />
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Requested predicates</p>
                                                    <div className="mt-2 space-y-2">
                                                        {Object.entries(proof.requested_predicates ?? {}).map(([key, predicate]) => (
                                                            <div key={key} className="rounded-md border p-3">
                                                                <p className="text-xs uppercase text-muted-foreground">{predicate.name}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {predicate.p_type} {predicate.p_value}
                                                                </p>
                                                                {predicate.restrictions?.length ? (
                                                                    <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                                                                        {predicate.restrictions.map((restriction, index) => (
                                                                            <li key={index}>{JSON.stringify(restriction)}</li>
                                                                        ))}
                                                                    </ul>
                                                                ) : (
                                                                    <p className="text-xs text-muted-foreground">No restrictions</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {Object.keys(proof.requested_predicates ?? {}).length === 0 ? (
                                                            <p className="text-xs text-muted-foreground">No predicate constraints provided.</p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs uppercase text-muted-foreground">Created</p>
                                                    <p>{proof.created_at ? new Date(proof.created_at).toLocaleString() : 'Unknown'}</p>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="ghost" onClick={() => setDetailsOpen(false)}>
                                                    Close
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                    <Button
                                        className="flex-1"
                                        onClick={() => void handlePresentProof(proof.presentation_exchange_id)}
                                        disabled={presentingId === proof.presentation_exchange_id}
                                    >
                                        {presentingId === proof.presentation_exchange_id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <FileCheck2 className="mr-2 h-4 w-4" />
                                        )}
                                        Present proof
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
