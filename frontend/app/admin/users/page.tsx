'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { UsersFilterPills, type UsersRoleFilter } from '@/components/admin/users/UsersFilterPills';
import { AddUserDialog } from '@/components/admin/users/AddUserDialog';
import { GET_ADMIN_USERS, type AdminUsersQueryResponse } from '@/lib/graphql/queries/admin-users';

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState<UsersRoleFilter>('ALL');
  const [page, setPage] = useState(1);
  const [addUserOpen, setAddUserOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery<AdminUsersQueryResponse>(GET_ADMIN_USERS, {
    variables: {
      filter: roleFilter === 'ALL' ? {} : { role: roleFilter },
      pagination: { page, limit: PAGE_SIZE },
    },
  });

  const { data: adminCountData } = useQuery<AdminUsersQueryResponse>(GET_ADMIN_USERS, {
    variables: { filter: { role: 'ADMIN' }, pagination: { page: 1, limit: 1 } },
  });

  const { data: userCountData } = useQuery<AdminUsersQueryResponse>(GET_ADMIN_USERS, {
    variables: { filter: { role: 'USER' }, pagination: { page: 1, limit: 1 } },
  });

  const adminCount = adminCountData?.adminUsers.total ?? 0;
  const userCount = userCountData?.adminUsers.total ?? 0;

  const handleFilterChange = (value: UsersRoleFilter) => {
    setRoleFilter(value);
    setPage(1);
  };

  const users = data?.adminUsers.items ?? [];
  const total = data?.adminUsers.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-ui-label text-text-muted uppercase tracking-widest">User Management</p>
          <h1 className="text-h2 font-bold">Users</h1>
          <p className="text-body-sm text-text-muted mt-1">
            {total.toLocaleString()} registered accounts
          </p>
        </div>

        <Button onClick={() => setAddUserOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <UsersFilterPills
        value={roleFilter}
        onChange={handleFilterChange}
        counts={{ all: adminCount + userCount, admin: adminCount, user: userCount }}
      />

      <div className="border-border-default bg-card border">
        {loading ? (
          <UsersTableSkeleton />
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-body-base text-text-muted mb-6">Failed to load users</p>
            <Button onClick={() => refetch()}>Try Again</Button>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-body-base text-text-muted">No users found</p>
          </div>
        ) : (
          <>
            <UsersTable users={users} />

            <div className="border-border-default flex items-center justify-between border-t px-6 py-4">
              <p className="text-body-sm text-text-muted">
                Showing {users.length} of {total.toLocaleString()} users
              </p>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="border-border-default hover:border-border-focus flex h-8 w-8 items-center justify-center border text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={`flex h-8 w-8 items-center justify-center border text-body-sm transition-colors ${
                        page === p
                          ? 'bg-brand-dark border-brand-dark text-text-inverse'
                          : 'border-border-default hover:border-border-focus'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="border-border-default hover:border-border-focus flex h-8 w-8 items-center justify-center border text-body-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label="Next page"
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AddUserDialog isOpen={addUserOpen} onClose={() => setAddUserOpen(false)} />
    </div>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="flex flex-col gap-px p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
