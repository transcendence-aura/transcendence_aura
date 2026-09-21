'use client';

import { useTranslations } from 'next-intl';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge = ({ count, className = '' }: NotificationBadgeProps) => {
  const t = useTranslations('Notifications');

  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`bg-brand-accent text-white absolute -top-3 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold rtl:right-auto rtl:-left-2 ${className}`}
      aria-label={t('unreadCount', { count })}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
