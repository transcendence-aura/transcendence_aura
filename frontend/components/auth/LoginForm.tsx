'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/form/button';
import { getPathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@apollo/client/react';
import { LOGIN_MUTATION } from '@/lib/auth/login.mutation';
import {
  LoginMutationData,
  LoginMutationVariables,
  VerifyMfaMutationData,
  VerifyMfaMutationVariables,
} from '@/lib/auth/auth.types';
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
  const [login, { loading }] = useMutation<LoginMutationData, LoginMutationVariables>(
    LOGIN_MUTATION,
  );
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
            mfaPendingToken,
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
    } catch (mfaError) {
      setError(isRateLimitedError(mfaError) ? t('errors.tooManyAttempts') : t('errors.mfaFailed'));
    }
  };

  if (step === 'mfa') {
    return (
      <div>
        <h2 className="font-cormorant mb-1.5 text-display-title font-normal text-text-primary">
          {t('mfaTitle')}
        </h2>
        <p className="mb-6 text-ui-label leading-relaxed text-text-secondary">{t('mfaSubtitle')}</p>
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            await handleMfa();
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-ui-nav text-text-muted">{t('mfaCodeLabel')}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={mfaCode}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, '').slice(0, 6);
                setMfaCode(value);
              }}
              placeholder="123456"
              className="border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-ui-label tracking-[0.35em] text-text-primary outline-none transition-colors"
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
              setMfaCode('');
              setMfaPendingToken(null);
              setError(null);
            }}
            className="w-full text-ui-label text-text-muted transition-colors hover:text-text-primary"
          >
            {t('mfaBack')}
          </button>
        </form>
        <div className="mt-6 flex items-center gap-2.5 bg-bg-subtle p-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-online" />
          <p className="text-body-base leading-relaxed text-text-secondary">{t('mfaHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-cormorant mb-1.5 text-display-title font-cormorant font-normal text-text-primary">
        {t('title')}
      </h2>
      <p className="mb-6 text-ui-label leading-relaxed text-text-secondary">{t('subtitle')}</p>
      {justRegistered && <p className="mb-4 text-ui-label text-status-online">{t('registered')}</p>}
      {passwordChanged && (
        <p className="mb-4 text-ui-label text-status-online">{t('passwordChanged')}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="mb-1.5 block text-ui-nav text-text-muted">{t('email')}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            className="border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-ui-label text-text-primary outline-none transition-colors"
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-ui-nav text-text-muted">{t('password')}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 pe-10 text-ui-label text-text-primary outline-none transition-colors ${
                error ? 'border-brand-accent' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-text-muted hover:text-text-primary absolute top-1/2 end-3 -translate-y-1/2"
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
            className="border-border-default text-text-muted hover:text-text-primary border-b pb-0.5 text-ui-label transition-colors"
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

      {/* Divider */}
      <div className="my-5 flex items-center gap-3">
        <div className="border-border-default flex-1 border-t" />
        <span className="text-ui-button text-text-muted">{t('divider')}</span>
        <div className="border-border-default flex-1 border-t" />
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-2.5">
        {/* Google Button */}
        <button
          type="button"
          className="border-border-default hover:bg-bg-subtle flex w-full items-center justify-center gap-2.5 border bg-bg-page py-2.5 text-ui-label text-text-secondary transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{t('google')}</span>
        </button>

        {/* Apple Button */}
        <button
          type="button"
          className="border-border-default hover:bg-bg-subtle flex w-full items-center justify-center gap-2.5 border bg-bg-page py-2.5 text-ui-label text-text-secondary transition-colors"
        >
          <svg className="h-4 w-4 fill-current" viewBox="0 0 170 170" aria-hidden="true">
            <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.7-7.75-12.01-14.13-6.42-9.69-11.41-20.73-14.98-33.11-3.57-12.38-5.35-24.32-5.35-35.81 0-15.11 3.8-27.42 11.41-36.93 7.61-9.51 17.06-14.36 28.36-14.55 4.8 0 10.15 1.25 16.05 3.76 5.91 2.51 9.77 3.82 11.59 3.93 1.57-.11 5.61-1.48 12.13-4.12 6.52-2.64 12.03-3.77 16.53-3.39 12.44.86 22.38 5.61 29.83 14.25-10.89 6.58-16.22 15.77-15.99 27.56.23 9.4 3.86 17.38 10.89 23.94 4.15 3.93 8.95 6.82 14.41 8.67-2.3 6.94-5.08 14.35-8.33 22.23zm-32.96-107.4c0-7.39 2.68-14.34 8.04-20.85 5.36-6.51 11.96-10.37 19.8-11.58.23 1.06.35 2.16.35 3.3 0 7.39-2.79 14.4-8.38 21.03-5.59 6.63-12.27 10.51-20.04 11.64-.11-1.07-.17-2.16-.17-3.54z" />
          </svg>
          <span>{t('apple')}</span>
        </button>
      </div>

      {/* 2FA Notice */}
      <div className="mt-6 flex items-start gap-2.5 bg-bg-subtle p-3">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-online" />
        <p className="text-body-base leading-relaxed text-text-secondary">{t('mfaNotice')}</p>
      </div>
    </div>
  );
}
