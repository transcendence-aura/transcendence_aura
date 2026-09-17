import { Avatar } from '@/components/ui/display/avatar';
import { Badge } from '@/components/ui/display/badge';
import { RoleSelect } from './RoleSelect';
import { StatusDot } from './StatusDot';
import { UserRowActions } from './UserRowActions';
import type { AdminUser } from '@/lib/graphql/queries/admin-users';

function formatJoinedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function UsersTable({ users }: { users: AdminUser[] }) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-border-default text-ui-label text-text-muted border-b uppercase tracking-wider">
          <th className="px-6 py-3 text-left font-medium">User</th>
          <th className="px-6 py-3 text-left font-medium">Role</th>
          <th className="px-6 py-3 text-left font-medium">Status</th>
          <th className="px-6 py-3 text-left font-medium">Joined</th>
          <th className="px-6 py-3" />
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id} className="border-border-default border-b last:border-b-0">
            <td className="px-6 py-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={user.name}
                  size="sm"
                  src={user.status === 'ACTIVE' ? `/api/v1/users/${user.id}/avatar` : undefined}
                />
                <div>
                  <p className="text-body-base text-text-primary font-medium">{user.name}</p>
                  <p className="text-body-sm text-text-muted">{user.email}</p>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              {user.status === 'DELETED' ? (
                <Badge variant="muted">{user.role === 'ADMIN' ? 'Admin' : 'User'}</Badge>
              ) : (
                <RoleSelect userId={user.id} role={user.role} />
              )}
            </td>
            <td className="px-6 py-4">
              <StatusDot status={user.status} />
            </td>
            <td className="text-body-sm text-text-muted px-6 py-4">
              {formatJoinedAt(user.joinedAt)}
            </td>
            <td className="px-6 py-4 text-right">
              <UserRowActions user={user} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
