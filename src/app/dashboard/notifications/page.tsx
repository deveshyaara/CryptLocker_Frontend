'use client';

import * as React from 'react';
import { formatDistanceToNow } from 'date-fns';
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
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useDashboard } from '@/context/dashboard-context';
import type { Notification } from '@/types/api';
import {
    Bell,
    BellOff,
    BellRing,
    Loader2,
    RefreshCw,
} from 'lucide-react';

function formatNotificationTime(notification: Notification) {
    if (!notification.created_at) {
        return '';
    }
    try {
        return formatDistanceToNow(new Date(notification.created_at), { addSuffix: true });
    } catch (error) {
        console.warn('Unable to format notification time', error);
        return '';
    }
}

function notificationVariant(type: Notification['type']) {
    if (!type) {
        return 'default';
    }
    if (type === 'credential') {
        return 'default';
    }
    if (type === 'proof') {
        return 'secondary';
    }
    if (type === 'connection') {
        return 'outline';
    }
    return 'outline';
}

const notificationTabs = [
    { key: 'all', label: 'All' },
    { key: 'credential', label: 'Credential Offers' },
    { key: 'proof', label: 'Proof Requests' },
    { key: 'connection', label: 'Connections' },
];

export default function NotificationsPage() {
    const {
        notifications,
        notificationsLoading,
        refreshNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
    } = useDashboard();

    const [activeTab, setActiveTab] = React.useState<string>('all');
    const [markingId, setMarkingId] = React.useState<number | null>(null);

    const unreadCount = React.useMemo(
        () => notifications.filter((note) => !note.is_read).length,
        [notifications],
    );

    const filteredNotifications = React.useMemo(() => {
        if (activeTab === 'all') {
            return notifications;
        }
        return notifications.filter((note) => note.type === activeTab);
    }, [notifications, activeTab]);

    const handleMarkNotification = React.useCallback(
        async (id: number) => {
            setMarkingId(id);
            await markNotificationAsRead(id);
            setMarkingId(null);
        },
        [markNotificationAsRead],
    );

    const iconForNotification = React.useCallback((type: Notification['type']) => {
        switch (type) {
            case 'credential':
                return <Bell className="h-4 w-4" />;
            case 'proof':
                return <BellRing className="h-4 w-4" />;
            case 'connection':
                return <RefreshCw className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    }, []);

    return (
        <div className="flex h-full flex-col">
            <header className="mb-6 flex flex-wrap items-center gap-3">
                <div>
                    <h1 className="font-headline text-3xl font-bold">Notifications</h1>
                    <p className="text-sm text-muted-foreground">
                        Stay on top of credential offers, proof requests, and connection events from your network.
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => void refreshNotifications()}
                        disabled={notificationsLoading}
                    >
                        {notificationsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        <span className="sr-only">Refresh notifications</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => void markAllNotificationsAsRead()}
                        disabled={unreadCount === 0 || notificationsLoading}
                    >
                        <BellRing className="h-4 w-4" />
                        Mark all as read
                    </Button>
                </div>
            </header>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid w-full grid-cols-4">
                    {notificationTabs.map((tab) => (
                        <TabsTrigger key={tab.key} value={tab.key}>
                            {tab.label}
                            {tab.key !== 'all' ? (
                                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                    {notifications.filter((note) => note.type === tab.key && !note.is_read).length}
                                </span>
                            ) : null}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="mt-4 flex-1">
                    {filteredNotifications.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <Card className="h-full">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Recent notifications</CardTitle>
                                <CardDescription>
                                    View updates from the last {filteredNotifications.length} event{filteredNotifications.length === 1 ? '' : 's'}.
                                </CardDescription>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-0">
                                <ul className="divide-y">
                                    {filteredNotifications.map((notification) => (
                                        <li key={notification.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex flex-1 items-start gap-3">
                                                <div className={`mt-1 rounded-full border p-2 ${notification.is_read ? 'border-muted' : 'border-primary/40 bg-primary/10'}`}>
                                                    {iconForNotification(notification.type)}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-foreground">{notification.title}</p>
                                                        <Badge variant={notificationVariant(notification.type)} className="capitalize">
                                                            {notification.type || 'general'}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatNotificationTime(notification) || 'Just now'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={notification.is_read ? 'outline' : 'default'}>
                                                    {notification.is_read ? 'Read' : 'Unread'}
                                                </Badge>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => void handleMarkNotification(notification.id)}
                                                    disabled={notification.is_read || markingId === notification.id}
                                                >
                                                    {markingId === notification.id ? (
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    ) : null}
                                                    {notification.is_read ? 'Marked' : 'Mark as read'}
                                                </Button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed p-10 text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-2 text-center">
                <BellOff className="h-10 w-10" />
                <p className="text-base font-medium text-foreground">All caught up</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                    You have no notifications in this category right now. Check back after you receive new activity from issuers or verifiers.
                </p>
            </div>
        </div>
    );
}
