import Link from 'next/link';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';

export function DashboardListCard({
  title,
  actionLabel,
  actionHref,
  loading,
  error,
  isEmpty,
  emptyMessage,
  onRetry,
  children,
}: {
  title: string;
  actionLabel: string;
  actionHref: string;
  loading: boolean;
  error: boolean;
  isEmpty: boolean;
  emptyMessage: string;
  onRetry: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-border-default bg-card border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-display-subtitle font-semibold">{title}</h2>
        <Link
          href={actionHref}
          className="text-ui-label text-text-muted hover:text-text-primary uppercase tracking-widest underline underline-offset-4 transition-colors"
        >
          {actionLabel}
        </Link>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="flex h-[140px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-body-base text-text-muted">Failed to load data</p>
          <Button onClick={onRetry}>Try Again</Button>
        </div>
      ) : isEmpty ? (
        <div className="flex h-[140px] items-center justify-center">
          <p className="text-body-base text-text-muted">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
