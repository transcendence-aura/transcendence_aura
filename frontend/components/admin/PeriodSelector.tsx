'use client';

import { ChevronDown } from 'lucide-react';
import type { AnalyticsPeriod } from '@/lib/graphql/queries/admin-dashboard';

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  TODAY: 'Today',
  LAST_WEEK: 'Last 7 Days',
  LAST_MONTH: 'Last 30 Days',
  LAST_6_MONTHS: 'Last 6 Months',
  ALL_TIME: 'All Time',
};

const PERIODS = Object.keys(PERIOD_LABELS) as AnalyticsPeriod[];

// A plain <select>, styled directly, rather than the shared Select component:
// overriding its baked-in px-4/py-3 sizing via className hits the same
// Tailwind specificity-tie issue already hit with Button's variant classes
// elsewhere in this codebase.
export function PeriodSelector({
  value,
  onChange,
}: {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as AnalyticsPeriod)}
        aria-label="Date range"
        className="bg-card text-text-primary text-ui-label border-border-default focus:border-border-focus w-auto appearance-none rounded-sm border py-2 pl-3 pr-8 uppercase tracking-widest outline-none"
      >
        {PERIODS.map((period) => (
          <option key={period} value={period}>
            {PERIOD_LABELS[period]}
          </option>
        ))}
      </select>
      <ChevronDown className="text-text-muted pointer-events-none absolute top-1/2 right-2 h-3.5 w-3.5 -translate-y-1/2" />
    </div>
  );
}
