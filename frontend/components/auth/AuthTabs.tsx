'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

export function AuthTabs() {
  const t = useTranslations('AuthTabs');
  const pathname = usePathname();
  const isSignIn = pathname.includes('/login');

  return (
    <div className="mb-8 flex items-center justify-center gap-4">
      <Link
        href="/login"
        className={`text-ui-nav transition-colors ${
          isSignIn ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'
        }`}
      >
        {t('signIn')}
      </Link>

      {/* Separator */}
      <div className="h-3 w-px bg-border-default" />

      <Link
        href="/register"
        className={`text-ui-nav transition-colors ${
          !isSignIn ? 'text-text-primary font-medium' : 'text-text-muted hover:text-text-primary'
        }`}
      >
        {t('createAccount')}
      </Link>
    </div>
  );
}
