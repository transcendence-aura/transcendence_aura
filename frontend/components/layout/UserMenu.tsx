'use client';

import { useEffect, useRef, useState } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, Settings, Shield, User } from 'lucide-react';
import { Avatar } from '@/components/ui/display/avatar';
import { useIsAdmin } from '@/lib/auth/use-is-admin';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { clearAccessToken } from '@/lib/auth/token-store';
import { LOGOUT_MUTATION } from '@/lib/auth/logout.mutation';
import { ME_QUERY } from '@/lib/graphql/queries/me';
import { useToast } from '@/components/ui/feedback/toast';

const ITEM_CLASS =
  'text-text-secondary hover:text-text-primary hover:bg-page focus-visible:outline-border-focus flex w-full items-center gap-3 px-4 py-2.5 text-xs tracking-wider transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2';

const MOBILE_ITEM_CLASS =
  'text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors';

function useLogout() {
  const router = useRouter();
  const client = useApolloClient();
  const [logout] = useMutation(LOGOUT_MUTATION);
  const { toast } = useToast();

  return async () => {
    try {
      await logout();
      clearAccessToken();
      await client.clearStore();
      router.push('/login');
    } catch {
      toast({
        message: 'Sign out failed, please retry',
        variant: 'error',
        duration: 5000,
      });
    }
  };
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const handleLogout = useLogout();
  const { data } = useQuery(ME_QUERY, {
    skip: !isAuthenticated,
    fetchPolicy: 'cache-and-network',
  });

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="text-text-secondary hover:text-text-primary transition-colors"
        aria-label="Sign in"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="focus-visible:outline-border-focus flex cursor-pointer items-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Avatar name={data?.me.name.charAt(0) ?? ''} size="sm" />
      </button>

      {open && (
        <div
          role="menu"
          className="bg-card border-border-default shadow-modal absolute inset-e-0 top-10 z-50 w-56 border py-2"
        >
          <div className="pb-2">
            <p className="text-text-muted px-4 text-[10px] uppercase tracking-wider">Status</p>
            <p className="text-text-primary px-4 text-xs font-medium">Connected</p>
          </div>

          <div className="border-border-default border-t pt-2">
            <Link
              href="/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className={ITEM_CLASS}
            >
              <Settings className="h-4 w-4" /> Settings
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className={ITEM_CLASS}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            )}
          </div>

          <div className="border-border-default mt-2 border-t pt-2">
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={`${ITEM_CLASS} text-status-error hover:text-status-error cursor-pointer`}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Drawer variant */
export function UserMenuMobile({ onNavigate }: { onNavigate: () => void }) {
  const isAuthenticated = useIsAuthenticated();
  const isAdmin = useIsAdmin();
  const handleLogout = useLogout();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        onClick={onNavigate}
        className={`${MOBILE_ITEM_CLASS} border-border-default border-t pt-4`}
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="border-border-default flex flex-col gap-4 border-t pt-4">
      <Link href="/settings" onClick={onNavigate} className={MOBILE_ITEM_CLASS}>
        Settings
      </Link>
      {isAdmin && (
        <Link href="/admin" onClick={onNavigate} className={MOBILE_ITEM_CLASS}>
          Admin
        </Link>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className={`${MOBILE_ITEM_CLASS} text-status-error cursor-pointer text-start`}
      >
        Sign out
      </button>
    </div>
  );
}
