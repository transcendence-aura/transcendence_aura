'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/form/button';
import { getPathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION } from '@/lib/auth/login.mutation';
import { VerifyMfaMutationData, VerifyMfaMutationVariables } from '@/lib/auth/auth.types';
import { getSafeReturnTo } from '@/lib/auth/return-to';
import { setAccessToken } from '@/lib/auth/token-store';
import { VERIFY_MFA_MUTATION } from '@/lib/auth/two-factor.mutations';
import { isRateLimitedError } from '@/lib/graphql-error';

type LoginStep = 'credentials' | 'mfa';

export function LoginForm() {
  const t = useTranslations('LoginForm');
  // Set by the register form when the account was created but the automatic sign-in failed.
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get('registered') === '1';
  // Set by the settings page after a password change: every session was revoked server-side.
  const passwordChanged = searchParams.get('passwordChanged') === '1';
  const returnTo = getSafeReturnTo(searchParams.get('returnTo'));
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [login, { loading }] = useMutation(LOGIN_MUTATION);
  const [step, setStep] = useState<LoginStep>('credentials');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaPendingToken, setMfaPendingToken] = useState<string | null>(null);
  const [verifyMfa, { loading: mfaLoading }] = useMutation<
    VerifyMfaMutationData,
    VerifyMfaMutationVariables
  >(VERIFY_MFA_MUTATION);
  const locale = useLocale();

  const validateForm = (): boolean => {
    if (!email.trim()) {
      setError(t('errors.emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('errors.emailInvalid'));
      return false;
    }
    if (!password) {
      setError(t('errors.passwordRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    try {
      const { data } = await login({
        variables: {
          input: {
            email: email.trim(),
            password,
          },
        },
      });

      const result = data?.login;

      if (!result) {
        setError(t('errors.generic'));
        return;
      }
      if (result.requiresMfa) {
        setMfaPendingToken(result.mfaPendingToken);
        setPassword('');
        setMfaCode('');
        setStep('mfa');
        return;
      }

      setAccessToken(result.accessToken);

      setPassword('');
      window.location.replace(getPathname({ href: returnTo, locale }));
    } catch (loginError) {
      setError(
        isRateLimitedError(loginError)
          ? t('errors.tooManyAttempts')
          : t('errors.invalidCredentials'),
      );
    }
  };

  const handleMfa = async () => {
    setError(null);

    if (!/^\d{6}$/.test(mfaCode)) {
      setError(t('errors.mfaCodeFormat'));
      return;
    }

    if (!mfaPendingToken) {
      setError(t('errors.mfaExpired'));
      setStep('credentials');
      return;
    }

    try {
      const { data } = await verifyMfa({
        variables: {
          input: {
            mfaPendingToken: mfaPendingToken,
            code: mfaCode,
          },
        },
      });

      const result = data?.verifyMfa;

      if (!result) {
        setError(t('errors.mfaFailed'));
        return;
      }

      setAccessToken(result.accessToken);
      setMfaCode('');
      setMfaPendingToken(null);
      window.location.replace(getPathname({ href: returnTo, locale }));
    } catch (verifyError) {
      setError(
        isRateLimitedError(verifyError) ? t('errors.tooManyAttempts') : t('errors.mfaFailed'),
      );
    }
  };

  if (step === 'mfa') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-cormorant text-text-primary text-display-title">{t('mfaTitle')}</h2>
          <p className="mt-2 text-ui-label text-text-secondary">{t('mfaSubtitle')}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleMfa();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-ui-nav text-text-muted">{t('mfaCodeLabel')}</label>
            <input
              type="text"
              dir="ltr"
              inputMode="numeric"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="border-border-default focus:border-border-focus tracking-[0.5em] text-center w-full border bg-bg-page px-3.5 py-2.5 text-body-base text-text-primary outline-none transition-colors"
            />
          </div>

          {error && <p className="text-ui-label text-brand-accent">{error}</p>}

          <Button
            type="submit"
            disabled={mfaLoading || mfaCode.length !== 6}
            className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
          >
            {mfaLoading ? t('mfaSubmitting') : t('mfaSubmit')}
          </Button>

          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setMfaPendingToken(null);
              setMfaCode('');
              setError(null);
            }}
            className="w-full text-center text-ui-label text-text-muted hover:text-text-primary transition-colors cursor-pointer"
          >
            {t('mfaBack')}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cormorant text-text-primary text-display-title">{t('title')}</h2>
        <p className="mt-2 text-ui-label text-text-secondary">{t('subtitle')}</p>
      </div>

      {justRegistered && <p className="text-ui-label text-status-online">{t('registered')}</p>}
      {passwordChanged && (
        <p className="text-ui-label text-status-online">{t('passwordChanged')}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-ui-nav text-text-muted">{t('email')}</label>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-start text-ui-label text-text-primary outline-none transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-ui-nav text-text-muted">{t('password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              dir="ltr"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 pr-10 text-left text-ui-label text-text-primary outline-none transition-colors ${
                error ? 'border-brand-accent' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && <p className="text-ui-label text-brand-accent">{error}</p>}

        {/* Forgot password */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            className="border-border-default text-text-muted hover:text-text-primary border-b pb-0.5 text-ui-label transition-colors cursor-pointer"
          >
            {t('forgotPassword')}
          </button>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={loading}
          className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
        >
          {loading ? t('submitting') : t('submit')}
        </Button>
      </form>

      {/* 2FA Notice */}
      <div className="mt-8 flex items-center justify-center gap-2 text-text-muted">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-status-online" />
        <p className="text-ui-label text-center">{t('mfaNotice')}</p>
      </div>
    </div>
  );
}
