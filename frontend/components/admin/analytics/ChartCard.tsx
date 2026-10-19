'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';

export function ChartCard({
  title,
  loading,
  error,
  isEmpty,
  emptyMessage = 'No data yet',
  onRetry,
  children,
}: {
  title: string;
  loading: boolean;
  error?: boolean;
  isEmpty: boolean;
  emptyMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="border-border-default bg-card border p-6">
      <h2 className="text-display-subtitle mb-4 font-semibold">{title}</h2>

      {loading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : error ? (
        <div className="flex h-[220px] flex-col items-center justify-center gap-4 text-center">
          <p className="text-body-base text-text-muted">Failed to load data</p>
          {onRetry && <Button onClick={onRetry}>Try Again</Button>}
        </div>
      ) : isEmpty ? (
        <div className="flex h-[220px] items-center justify-center">
          <p className="text-body-base text-text-muted">{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
