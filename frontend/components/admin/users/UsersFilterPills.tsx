'use client';

import type { AdminUserRole } from '@/lib/graphql/queries/admin-users';

export type UsersRoleFilter = AdminUserRole | 'ALL';

interface UsersFilterPillsProps {
  value: UsersRoleFilter;
  onChange: (value: UsersRoleFilter) => void;
  counts: { all: number; admin: number; user: number };
}

export function UsersFilterPills({ value, onChange, counts }: UsersFilterPillsProps) {
  const pills: { key: UsersRoleFilter; label: string; count: number }[] = [
    { key: 'ALL', label: 'All', count: counts.all },
    { key: 'ADMIN', label: 'Admin', count: counts.admin },
    { key: 'USER', label: 'User', count: counts.user },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {pills.map((pill) => (
        <button
          key={pill.key}
          type="button"
          onClick={() => onChange(pill.key)}
          className={`text-ui-badge rounded-pill border px-4 py-2 uppercase tracking-wider transition-colors ${
            value === pill.key
              ? 'bg-brand-dark border-brand-dark text-text-inverse'
              : 'border-border-default text-text-secondary hover:text-text-primary'
          }`}
        >
          {pill.label} ({pill.count})
        </button>
      ))}
    </div>
  );
}
