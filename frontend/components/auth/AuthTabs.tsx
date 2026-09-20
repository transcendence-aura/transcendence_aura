'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from '@/i18n/navigation';

export function AuthTabs() {
  const pathname = usePathname();
  const isSignIn = pathname.includes('/login');

  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      <Link
        href="/login"
        className={`text-xs uppercase tracking-wider transition-colors ${
          isSignIn ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'
        }`}
      >
        Sign in
      </Link>

      {/* Separator */}
      <div className="h-3 w-px bg-border-default" />

      <Link
        href="/register"
        className={`text-xs uppercase tracking-wider transition-colors ${
          !isSignIn ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'
        }`}
      >
        Create account
      </Link>
    </div>
  );
}
