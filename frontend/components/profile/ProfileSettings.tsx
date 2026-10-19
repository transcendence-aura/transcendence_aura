'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import { Badge } from '@/components/ui/display/badge';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { Switch } from '@/components/ui/form/switch';
import { Link, useRouter } from '@/i18n/navigation';
import { wasSignedOutByUser } from '@/lib/auth/token-store';
import { useIsAuthenticated } from '@/lib/auth/use-is-authenticated';
import { ME_QUERY } from '@/lib/graphql/queries/me';
import { ApiKeySection } from './ApiKeySection';
import { EmailChangeDialog } from './EmailChangeDialog';
import { PasswordChangeDialog } from './PasswordChangeDialog';
import { ProfileForm } from './ProfileForm';
import { SettingsRow, SettingsSection } from './SettingsSection';

// Keys of the `ProfileSettings` messages.
const NOTIFICATION_PREFERENCES = ['newMessages', 'newFollowers', 'newsletter'] as const;

// Same look as Button's "link" variant, for a navigation link.
const LINK_CLASS =
  'text-text-primary underline underline-offset-4 hover:opacity-70 text-ui-button uppercase';

function ComingSoon() {
  const t = useTranslations('ProfileSettings');

  return (
    <Badge variant="muted" className="text-ui-badge uppercase">
      {t('comingSoon')}
    </Badge>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-11 w-36" />
    </div>
  );
}

export function ProfileSettings() {
  const t = useTranslations('ProfileSettings');
  const router = useRouter();
  const isAuthenticated = useIsAuthenticated();
  const { data, loading, error, refetch } = useQuery(ME_QUERY, { skip: !isAuthenticated });
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  // Whether the user was signed in while this page was on screen.
  const wasAuthenticated = useRef(isAuthenticated);

  // The app only renders pages once the session restore has finished (AuthProvider), so a missing
  // token here means the session is gone: send them to sign in instead of an endless skeleton.
  // Not when they signed out from this very page: the sign-out already navigates to /login by
  // itself. Arriving here without a session (a link, or a click after signing out) always redirects.
  useEffect(() => {
    if (isAuthenticated) {
      wasAuthenticated.current = true;
      return;
    }
    if (wasAuthenticated.current && wasSignedOutByUser()) return;
    router.replace('/login?returnTo=%2Fsettings');
  }, [isAuthenticated, router]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } catch {
      // Still failing: the error state above stays on screen.
    } finally {
      setIsRetrying(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-text-muted text-body-base">{t('loadFailed')}</p>
        <Button onClick={handleRetry} disabled={isRetrying} className="text-ui-button uppercase">
          {isRetrying ? t('retrying') : t('retry')}
        </Button>
      </div>
    );
  }

  // Until the access token is available the query is skipped: keep showing the skeleton.
  if (!isAuthenticated || loading || !data) {
    return <SettingsSkeleton />;
  }

  const { name, email, handle, bio } = data.me;

  return (
    <div className="flex flex-col gap-10">
      <SettingsSection title={t('profileInformation')}>
        {/* Keyed on the saved values only: changing the email must not reset the form. */}
        <ProfileForm
          key={`${handle}|${bio ?? ''}`}
          initial={{ handle, bio: bio ?? '' }}
          name={name}
        />
      </SettingsSection>

      <SettingsSection title={t('security')}>
        <div>
          <SettingsRow label={t('emailAddress')}>
            <span className="text-text-secondary break-all text-body-sm">{email}</span>
            <Button
              type="button"
              variant="link"
              onClick={() => setIsEmailDialogOpen(true)}
              className="text-ui-button uppercase"
            >
              {t('changeEmail')}
            </Button>
          </SettingsRow>
          <SettingsRow label={t('password')}>
            <Button
              type="button"
              variant="link"
              onClick={() => setIsPasswordDialogOpen(true)}
              className="text-ui-button uppercase"
            >
              {t('changePassword')}
            </Button>
          </SettingsRow>
          <SettingsRow label={t('twoFactor')} description={t('twoFactorDescription')}>
            <Link href="/settings/security" className={LINK_CLASS}>
              {t('manage')}
            </Link>
          </SettingsRow>
        </div>
      </SettingsSection>

      <SettingsSection title={t('notifications')} hint={t('notificationsHint')}>
        <div>
          {NOTIFICATION_PREFERENCES.map((preference) => (
            <SettingsRow key={preference} label={t(preference)}>
              <Switch disabled aria-label={t(preference)} className="opacity-50" />
            </SettingsRow>
          ))}
        </div>
      </SettingsSection>

      <ApiKeySection />

      <SettingsSection title={t('dangerZone')}>
        <SettingsRow label={t('deleteAccount')}>
          <ComingSoon />
        </SettingsRow>
      </SettingsSection>

      <EmailChangeDialog
        isOpen={isEmailDialogOpen}
        onClose={() => setIsEmailDialogOpen(false)}
        currentEmail={email}
      />
      <PasswordChangeDialog
        isOpen={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
      />
    </div>
  );
}
