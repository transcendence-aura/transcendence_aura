'use client';

import { useState, useSyncExternalStore } from 'react';
import { PeriodSelector } from '@/components/admin/PeriodSelector';
import { ComingSoonCard } from '@/components/admin/dashboard/ComingSoonCard';
import { KpiCard } from '@/components/admin/dashboard/KpiCard';
import { RecentUsersCard } from '@/components/admin/dashboard/RecentUsersCard';
import { TopProductsCard } from '@/components/admin/dashboard/TopProductsCard';
import type { AnalyticsPeriod } from '@/lib/graphql/queries/admin-dashboard';

function formatNow(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

const subscribeToNothing = () => () => {};

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<AnalyticsPeriod>('LAST_MONTH');
  // Empty on the server: rendering the current time there would mismatch on hydration.
  const now = useSyncExternalStore(subscribeToNothing, formatNow, () => '');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-ui-label text-text-muted uppercase tracking-widest">Overview</p>
          <h1 className="text-h2 font-bold">Dashboard</h1>
          <p className="text-body-sm text-text-muted mt-1 min-h-5">{now}</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total revenue" />
        <KpiCard label="Orders" />
        <KpiCard label="Active users" />
        <KpiCard label="Avg. order value" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ComingSoonCard title="Revenue" />
        <ComingSoonCard title="Orders by category" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RecentUsersCard />
        <TopProductsCard period={period} />
      </div>
    </div>
  );
}
