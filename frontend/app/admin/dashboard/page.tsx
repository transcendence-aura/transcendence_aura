'use client';

import { useQuery } from '@apollo/client/react';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { RegistrationsChart } from '@/components/admin/dashboard/RegistrationsChart';
import {
  GET_REGISTRATIONS_OVER_TIME,
  type RegistrationsOverTimeResponse,
} from '@/lib/graphql/queries/admin-dashboard';

export default function AdminDashboardPage() {
  const { data, loading, error, refetch } = useQuery<RegistrationsOverTimeResponse>(
    GET_REGISTRATIONS_OVER_TIME,
    { variables: { period: 'LAST_MONTH' } },
  );

  const points = data?.registrationsOverTime ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-ui-label text-text-muted uppercase tracking-widest">Overview</p>
        <h1 className="text-h2 font-bold">Dashboard</h1>
      </div>

      <div className="border-border-default bg-card w-full border p-6 md:w-1/2">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-display-subtitle font-semibold">Registrations</h2>
          <span className="text-ui-label text-text-muted uppercase tracking-widest">
            Last 30 days
          </span>
        </div>

        {loading ? (
          <Skeleton className="h-[240px] w-full" />
        ) : error ? (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <p className="text-body-base text-text-muted">Failed to load registrations</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : (
          <RegistrationsChart data={points} />
        )}
      </div>
    </div>
  );
}
