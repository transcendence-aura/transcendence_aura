'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useCurrentUser } from '@/lib/auth/use-current-user';
import { clearAccessToken } from '@/lib/auth/token-store';
import { useIsAdmin } from '@/lib/auth/use-is-admin';

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useCurrentUser();
  const isAdmin = useIsAdmin();

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    clearAccessToken();

    try {
      await fetch('https://localhost/graphql', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation Logout { logout }`,
        }),
      });
    } catch {
      // Ignore network failures
    }

    // Redirect to home page, to prevent/login redirect loops
    window.location.href = '/';
  };

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="text-text-secondary hover:text-text-primary transition-colors flex items-center"
        aria-label="Sign in"
      >
        <User className="h-5 w-5" />
      </Link>
    );
  }

  const userInitial = (() => {
    if (isAdmin) return 'A';

    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }

    if (user?.id?.endsWith('000000000002')) return 'C';
    if (user?.id?.endsWith('000000000003')) return 'M';
    if (user?.id?.endsWith('000000000004')) return 'S';

    return 'U';
  })();

  const memberSinceFormatted = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="bg-bg-subtle border-border-default hover:border-text-primary flex h-8 w-8 items-center justify-center rounded-full border text-xs font-medium uppercase tracking-wider text-text-primary transition-colors focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        {userInitial}
      </button>

      {isOpen && (
        <div className="bg-card border-border-default absolute right-0 mt-2 w-48 border py-1.5 shadow-lg z-50">
          <div className="border-border-default border-b px-3.5 py-2">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Status</p>
            <p className="truncate text-xs font-medium text-text-primary">Connected</p>
            <p className="text-[10px] text-text-muted mt-0.5">
              Member since {memberSinceFormatted}
            </p>
          </div>

          <Link
            href="/account/settings"
            onClick={() => setIsOpen(false)}
            className="text-text-secondary hover:bg-bg-subtle hover:text-text-primary flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Profile settings</span>
          </Link>

          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:bg-bg-subtle hover:text-text-primary flex items-center gap-2.5 px-3.5 py-2 text-xs transition-colors"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin</span>
            </Link>
          )}

          <div className="border-border-default my-1 border-t" />

          <button
            type="button"
            onClick={handleLogout}
            className="text-brand-accent hover:bg-bg-subtle flex w-full items-center gap-2.5 px-3.5 py-2 text-xs transition-colors text-left"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
