interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export const NotificationBadge = ({ count, className = '' }: NotificationBadgeProps) => {
  if (count === 0) {
    return null;
  }

  return (
    <span
      className={`bg-brand-accent text-white absolute -top-3 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold rtl:right-auto rtl:-left-2 ${className}`}
      aria-label={`${count} unread notification${count !== 1 ? 's' : ''}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};
