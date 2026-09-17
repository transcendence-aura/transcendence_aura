'use client';

import { useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { useToast } from '@/components/ui/feedback/toast';
import { ConfirmActionDialog } from './ConfirmActionDialog';
import {
  ADMIN_SUSPEND_USER,
  ADMIN_REINSTATE_USER,
  ADMIN_DELETE_USER,
  type AdminUser,
} from '@/lib/graphql/queries/admin-users';

type PendingAction = 'suspend' | 'delete' | null;

export function UserRowActions({ user }: { user: AdminUser }) {
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [suspendUser, { loading: suspending }] = useMutation(ADMIN_SUSPEND_USER, {
    onCompleted: () => {
      toast({ message: 'User suspended', variant: 'success' });
      setPendingAction(null);
    },
    onError: () => {
      toast({ message: 'Failed to suspend user', variant: 'error' });
      setPendingAction(null);
    },
  });

  const [reinstateUser, { loading: reinstating }] = useMutation(ADMIN_REINSTATE_USER, {
    onCompleted: () => {
      toast({ message: 'User reinstated', variant: 'success' });
    },
    onError: () => {
      toast({ message: 'Failed to reinstate user', variant: 'error' });
    },
  });

  const [deleteUser, { loading: deleting }] = useMutation(ADMIN_DELETE_USER, {
    onCompleted: () => {
      toast({ message: 'User deleted', variant: 'success' });
      setPendingAction(null);
    },
    onError: () => {
      toast({ message: 'Failed to delete user', variant: 'error' });
      setPendingAction(null);
    },
  });

  const canSuspend = user.status === 'ACTIVE';
  const canReinstate = user.status === 'SUSPENDED';
  const canDelete = user.status !== 'DELETED';

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        className="text-text-muted hover:text-text-primary flex h-8 w-8 items-center justify-center transition-colors"
        aria-label="User actions"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div
            role="menu"
            className="border-border-default bg-card shadow-modal absolute right-0 z-20 mt-1 w-40 border"
          >
            <button
              type="button"
              role="menuitem"
              disabled={!canSuspend}
              onClick={() => {
                setMenuOpen(false);
                setPendingAction('suspend');
              }}
              className="text-body-sm text-text-primary hover:bg-page w-full px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Suspend
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!canReinstate || reinstating}
              onClick={() => {
                setMenuOpen(false);
                reinstateUser({ variables: { userId: user.id } });
              }}
              className="text-body-sm text-text-primary hover:bg-page w-full px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reinstate
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={!canDelete}
              onClick={() => {
                setMenuOpen(false);
                setPendingAction('delete');
              }}
              className="text-body-sm text-status-error hover:bg-page w-full px-4 py-2.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete
            </button>
          </div>
        </>
      )}

      <ConfirmActionDialog
        isOpen={pendingAction === 'suspend'}
        onClose={() => setPendingAction(null)}
        onConfirm={() => suspendUser({ variables: { userId: user.id } })}
        title="Suspend user"
        description={`${user.name} will be signed out and unable to log back in until reinstated. Continue?`}
        confirmLabel="Suspend"
        loading={suspending}
      />

      <ConfirmActionDialog
        isOpen={pendingAction === 'delete'}
        onClose={() => setPendingAction(null)}
        onConfirm={() => deleteUser({ variables: { userId: user.id } })}
        title="Delete user"
        description={`${user.name} will be permanently deactivated. This cannot be undone from this page. Continue?`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
}
