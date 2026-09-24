'use client';

import { useEffect, useRef, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { Bell } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { useRealtime } from '@/lib/realtime/realtime-provider';
import { useToast } from '@/components/ui/feedback/toast';
import { NotificationBadge } from '@/components/ui/feedback/notification-badge';
import { formatRelativeTime } from '@/lib/format-relative-time';
import {
  CONVERSATION_REQUEST_MARKER,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  NOTIFICATIONS_QUERY,
  type Notification,
} from '@/lib/graphql/queries/notifications';

const QUERY_VARIABLES = { unreadOnly: true };

function targetHref(notification: Notification): string {
  if (notification.type === 'MESSAGE') return '/community?tab=message';
  if (notification.type === 'FOLLOW' && notification.actor) {
    return `/profile/${notification.actor.handle}`;
  }
  return '#';
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [displayedNotifications, setDisplayedNotifications] = useState<Notification[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useIsAuthenticated();
  const client = useApolloClient();
  const { on } = useRealtime();
  const { toast } = useToast();
  const t = useTranslations('Notifications');

  const notificationText = (notification: Notification): string => {
    if (notification.type === 'MESSAGE' && notification.actor) {
      return notification.title === CONVERSATION_REQUEST_MARKER
        ? t('newRequest', { name: notification.actor.name })
        : t('newMessage', { name: notification.actor.name });
    }
    if (notification.type === 'FOLLOW' && notification.actor) {
      return t('newFollow', { name: notification.actor.name });
    }
    return notification.title ?? notification.body ?? t('fallback');
  };

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
      refetch().catch(() => {});
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
      toast({ message: t('markReadFailed'), variant: 'error' });
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
        aria-label={t('label')}
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
            <p className="text-body-sm text-text-muted px-4 py-6 text-center">{t('empty')}</p>
          ) : (
            visibleNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={targetHref(notification)}
                onClick={() => setOpen(false)}
                className="hover:bg-page flex flex-col gap-1 px-4 py-3 transition-colors"
              >
                <span className="text-ui-label leading-[1.8] text-text-primary">
                  {notificationText(notification)}
                </span>
                <span className="text-ui-caption leading-[1.5] tracking-[0.06em] text-text-muted">
                  {formatRelativeTime(notification.createdAt, t('now'))}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
