'use client';

import { useEffect, useRef, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useRealtime } from '@/lib/realtime/realtime-provider';
import { useToast } from '@/components/ui/feedback/toast';
import { NotificationBadge } from '@/components/ui/feedback/notification-badge';
import {
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  NOTIFICATIONS_QUERY,
  type Notification,
} from '@/lib/graphql/queries/notifications';

const QUERY_VARIABLES = { unreadOnly: true };

function targetHref(notification: Notification): string {
  if (notification.type === 'MESSAGE') return '/chat';
  return '#';
}

function notificationText(notification: Notification): string {
  if (notification.type === 'MESSAGE' && notification.actor) {
    return `${notification.actor.name} sent you a message`;
  }
  return notification.title ?? notification.body ?? 'New notification';
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.floor(diffHours / 24)}d`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useIsAuthenticated();
  const client = useApolloClient();
  const { on } = useRealtime();
  const { toast } = useToast();

  const { data, refetch } = useQuery(NOTIFICATIONS_QUERY, {
    variables: QUERY_VARIABLES,
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });
  const [markAllRead] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION);

  const notifications = data?.notifications ?? [];
  const unreadCount = notifications.length;

  useEffect(() => {
    return on('newNotification', () => {
      refetch();
    });
  }, [on, refetch]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) {
    return null;
  }

  const handleToggle = async () => {
    const nextOpen = !open;

    if (nextOpen) {
      setDisplayedNotifications(data ? notifications : null);
    } else {
      setDisplayedNotifications(null);
    }
    setOpen(nextOpen);

    if (!nextOpen || unreadCount === 0) return;

    const snapshot = client.cache.readQuery({
      query: NOTIFICATIONS_QUERY,
      variables: QUERY_VARIABLES,
    });

    client.cache.writeQuery({
      query: NOTIFICATIONS_QUERY,
      variables: QUERY_VARIABLES,
      data: { notifications: [] },
    });

    try {
      await markAllRead();
    } catch {
      if (snapshot) {
        client.cache.writeQuery({
          query: NOTIFICATIONS_QUERY,
          variables: QUERY_VARIABLES,
          data: snapshot,
        });
      }
      toast({ message: 'Could not mark notifications as read', variant: 'error' });
    }
  };

  const visibleNotifications = open ? (displayedNotifications ?? notifications) : notifications;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Notifications"
        className="text-text-secondary hover:text-text-primary relative transition-colors"
      >
        <Bell className="h-5 w-5" />
        <NotificationBadge count={open ? 0 : unreadCount} />
      </button>

      {open && (
        <div
          role="menu"
          className="bg-card border-border-default shadow-modal absolute inset-e-0 top-10 z-50 max-h-96 w-80 overflow-y-auto border py-2"
        >
          {visibleNotifications.length === 0 ? (
            <p className="text-body-sm text-text-muted px-4 py-6 text-center">
              No notifications yet.
            </p>
          ) : (
            visibleNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={targetHref(notification)}
                onClick={() => setOpen(false)}
                className="hover:bg-page flex flex-col gap-1 px-4 py-3 transition-colors"
              >
                <span className="text-xs leading-[1.8] text-text-primary">
                  {notificationText(notification)}
                </span>
                <span className="text-[9px] leading-[1.5] tracking-[0.06em] text-text-muted">
                  {formatRelativeTime(notification.createdAt)}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
