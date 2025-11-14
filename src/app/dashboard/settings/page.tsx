'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getWalletDid, getWalletInfo } from '@/lib/api/holder';
import type { WalletDid, WalletInfo } from '@/types/api';
import { ClipboardCopy, Loader2, ShieldCheck, User as UserIcon } from 'lucide-react';

export default function SettingsPage() {
    const { user, token } = useAuth();
    const { toast } = useToast();

    const [walletInfo, setWalletInfo] = React.useState<WalletInfo | null>(null);
    const [walletDid, setWalletDid] = React.useState<WalletDid | null>(null);
    const [loadingWallet, setLoadingWallet] = React.useState(false);
    const [walletError, setWalletError] = React.useState<string | null>(null);

    const loadWallet = React.useCallback(async () => {
        if (!token) {
            setWalletInfo(null);
            setWalletDid(null);
            return;
        }
        try {
            setLoadingWallet(true);
            setWalletError(null);
            const [info, did] = await Promise.all([getWalletInfo(token), getWalletDid(token)]);
            setWalletInfo(info ?? null);
            setWalletDid(did ?? null);
        } catch (err) {
            console.error('Failed to load wallet info', err);
            setWalletError(err instanceof Error ? err.message : 'Unable to load wallet details');
        } finally {
            setLoadingWallet(false);
        }
    }, [token]);

    React.useEffect(() => {
        void loadWallet();
    }, [loadWallet]);

    const copyToClipboard = React.useCallback(async (value: string, label: string) => {
        try {
            await navigator.clipboard.writeText(value);
            toast({ description: `${label} copied to clipboard.` });
        } catch (err) {
            console.error('Clipboard error', err);
            toast({ description: `Unable to copy ${label}.`, variant: 'destructive' });
        }
    }, [toast]);

    return (
        <div className="flex flex-col">
            <header className="mb-6">
                <h1 className="font-headline text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your profile, wallet, and application preferences.</p>
            </header>

            <Tabs defaultValue="profile" className="flex-1">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="wallet">Wallet</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Your profile</CardTitle>
                            <CardDescription>Update the basic information associated with your account.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4 rounded-lg border p-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <UserIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{user?.full_name || user?.username || 'User'}</p>
                                    <p className="text-xs text-muted-foreground">Joined {user?.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'recently'}</p>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="profile-username">Username</Label>
                                    <Input id="profile-username" value={user?.username || ''} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="profile-email">Email</Label>
                                    <Input id="profile-email" type="email" value={user?.email || 'Not provided'} readOnly />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profile-id">Account ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="profile-id" value={user?.id?.toString() ?? '—'} readOnly />
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            if (user?.id) {
                                                void copyToClipboard(user.id.toString(), 'Account ID');
                                            }
                                        }}
                                        disabled={!user?.id}
                                    >
                                        <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security</CardTitle>
                            <CardDescription>Strengthen your account with recommended security practices.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current password</Label>
                                <Input id="current-password" type="password" placeholder="••••••••" disabled />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="new-password">New password</Label>
                                    <Input id="new-password" type="password" placeholder="Choose a strong password" disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm password</Label>
                                    <Input id="confirm-password" type="password" placeholder="Retype new password" disabled />
                                </div>
                            </div>
                            <Button className="w-fit" disabled>
                                Update password
                            </Button>
                            <Separator />
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <h3 className="font-medium">Two-factor authentication</h3>
                                    <p className="text-sm text-muted-foreground">Protect your wallet with an extra verification step (coming soon).</p>
                                </div>
                                <Switch disabled />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="wallet" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wallet overview</CardTitle>
                            <CardDescription>Inspect your wallet metadata and distributed identifiers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {walletError ? (
                                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                                    {walletError}
                                </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => void loadWallet()}
                                    disabled={loadingWallet}
                                >
                                    {loadingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                    Refresh wallet
                                </Button>
                                {walletInfo?.created_at ? (
                                    <p className="text-xs text-muted-foreground">
                                        Created {formatDistanceToNow(new Date(walletInfo.created_at), { addSuffix: true })}
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="wallet-id">Wallet ID</Label>
                                    <div className="flex items-center gap-2">
                                        <Input id="wallet-id" value={walletInfo?.wallet_id ?? 'Not available'} readOnly />
                                        <Button
                                            variant="outline"
                                            onClick={() => walletInfo?.wallet_id && void copyToClipboard(walletInfo.wallet_id, 'Wallet ID')}
                                            disabled={!walletInfo?.wallet_id}
                                        >
                                            <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="wallet-mode">Key management</Label>
                                    <Input id="wallet-mode" value={walletInfo?.key_management_mode ?? 'custodial'} readOnly />
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="wallet-did">Public DID</Label>
                                <div className="flex items-center gap-2">
                                    <Input id="wallet-did" value={walletDid?.did ?? 'Not published'} readOnly />
                                    <Button
                                        variant="outline"
                                        onClick={() => walletDid?.did && void copyToClipboard(walletDid.did, 'Public DID')}
                                        disabled={!walletDid?.did}
                                    >
                                        <ClipboardCopy className="mr-2 h-4 w-4" /> Copy
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="wallet-verkey">Verification key</Label>
                                <Input id="wallet-verkey" value={walletDid?.verkey ?? 'Not available'} readOnly />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Application preferences</CardTitle>
                            <CardDescription>Personalize CryptLocker to fit how you work.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <h3 className="font-medium">Dark mode</h3>
                                    <p className="text-sm text-muted-foreground">Use the system theme for now. Custom themes are coming soon.</p>
                                </div>
                                <Switch disabled />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <h3 className="font-medium">Email notifications</h3>
                                    <p className="text-sm text-muted-foreground">Receive summaries in your inbox (feature under development).</p>
                                </div>
                                <Switch defaultChecked disabled />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
