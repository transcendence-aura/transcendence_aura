import type { AdminUserStatus } from '@/lib/graphql/queries/admin-users';

const STATUS_CONFIG: Record<AdminUserStatus, { dot: string; label: string }> = {
  ACTIVE: { dot: 'bg-status-online', label: 'Active' },
  SUSPENDED: { dot: 'bg-amber-500', label: 'Suspended' },
  DELETED: { dot: 'bg-status-error', label: 'Deleted' },
};

export function StatusDot({ status }: { status: AdminUserStatus }) {
  const { dot, label } = STATUS_CONFIG[status];

  return (
    <span className="text-body-sm text-text-secondary inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
