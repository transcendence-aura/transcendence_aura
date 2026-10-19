'use client';

import { useQuery } from '@apollo/client/react';
import { StatusDot } from '@/components/admin/users/StatusDot';
import { Avatar } from '@/components/ui/display/avatar';
import { Badge } from '@/components/ui/display/badge';
import { GET_ADMIN_USERS, type AdminUsersQueryResponse } from '@/lib/graphql/queries/admin-users';
import { DashboardListCard } from './DashboardListCard';

const RECENT_USERS_COUNT = 3;

export function RecentUsersCard() {
  const { data, loading, error, refetch } = useQuery<AdminUsersQueryResponse>(GET_ADMIN_USERS, {
    variables: { filter: {}, pagination: { page: 1, limit: RECENT_USERS_COUNT } },
  });

  const users = data?.adminUsers.items ?? [];

  return (
    <DashboardListCard
      title="Users"
      actionLabel="Manage all"
      actionHref="/admin/users"
      loading={loading}
      error={Boolean(error)}
      isEmpty={users.length === 0}
      emptyMessage="No users yet"
      onRetry={() => refetch()}
    >
      <table className="w-full">
        <thead>
          <tr className="border-border-default text-ui-label text-text-muted border-b uppercase tracking-wider">
            <th className="py-3 text-left font-medium">User</th>
            <th className="py-3 text-left font-medium">Role</th>
            <th className="py-3 text-left font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-border-default border-b last:border-b-0">
              <td className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={user.name}
                    size="sm"
                    src={user.status === 'ACTIVE' ? `/api/v1/users/${user.id}/avatar` : undefined}
                  />
                  <span className="text-body-base text-text-primary font-medium">{user.name}</span>
                </div>
              </td>
              <td className="py-3">
                <Badge variant={user.role === 'ADMIN' ? 'dark' : 'muted'}>
                  {user.role === 'ADMIN' ? 'Admin' : 'User'}
                </Badge>
              </td>
              <td className="py-3">
                <StatusDot status={user.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardListCard>
  );
}
