/* eslint-disable */
'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superAdminNotificationsApi } from '@/lib/api';
import { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Bell, CheckCircle } from 'lucide-react';

export default function SuperAdminNotificationsPage() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['super-admin', 'notifications'],
    queryFn: async () => {
      const response = await superAdminNotificationsApi.list();
      return response.data;
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: string) => superAdminNotificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'notifications'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update notification.');
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => superAdminNotificationsApi.markAllAsRead(),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'notifications'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to mark all notifications.');
    },
  });

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">System Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay ahead of key platform events, billing alerts, and tenant lifecycle milestones.
            Every entry is logged for audit oversight.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => markAllMutation.mutate()}
          disabled={!unreadCount || markAllMutation.isPending}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Recent notifications</CardTitle>
          <Badge variant="secondary">{unreadCount} unread</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.map((notification: Notification) => (
            <div key={notification.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <Bell className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notification.read && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                    disabled={markAsReadMutation.isPending}
                  >
                    Mark as read
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              {notification.link && (
                <a
                  className="text-sm font-medium text-primary hover:underline"
                  href={notification.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View details
                </a>
              )}
            </div>
          ))}

          {!notifications.length && !notificationsQuery.isLoading && (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up. New events will surface here instantly.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
