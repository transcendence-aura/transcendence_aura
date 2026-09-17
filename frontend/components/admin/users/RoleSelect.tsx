'use client';

import { useMutation } from '@apollo/client/react';
import { Select } from '@/components/ui/form/select';
import { useToast } from '@/components/ui/feedback/toast';
import {
  ADMIN_SET_USER_ROLE,
  GET_ADMIN_USERS,
  type AdminUserRole,
} from '@/lib/graphql/queries/admin-users';

const ROLES: AdminUserRole[] = ['USER', 'ADMIN'];

interface RoleSelectProps {
  userId: string;
  role: AdminUserRole;
  disabled?: boolean;
}

export function RoleSelect({ userId, role, disabled = false }: RoleSelectProps) {
  const { toast } = useToast();

  const [setUserRole, { loading }] = useMutation(ADMIN_SET_USER_ROLE, {
    // The row itself updates via Apollo's normalized cache (id match), but
    // promoting/demoting moves the user between the Admin/User filter pill
    // counts, which are separate cached queries the cache has no way to
    // know are related — refetch them explicitly, same as AddUserDialog.
    refetchQueries: [GET_ADMIN_USERS],
    onCompleted: () => {
      toast({ message: 'Role updated', variant: 'success' });
    },
    onError: () => {
      toast({ message: 'Failed to update role', variant: 'error' });
    },
  });

  return (
    <Select
      value={role}
      disabled={disabled || loading}
      onChange={(e) => {
        const nextRole = e.target.value as AdminUserRole;
        if (nextRole === role) return;
        setUserRole({ variables: { userId, role: nextRole } });
      }}
      className="w-32 py-2 text-body-sm"
      aria-label="Change role"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r === 'ADMIN' ? 'Admin' : 'User'}
        </option>
      ))}
    </Select>
  );
}
