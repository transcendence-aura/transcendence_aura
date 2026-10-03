'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useMutation } from '@apollo/client/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/form/button';
import { getValidationErrorMessage } from '@/lib/graphql-error';
import { LOGIN_MUTATION } from '@/lib/auth/login.mutation';
import { REGISTER_MUTATION } from '@/lib/auth/register.mutation';
import { setAccessToken } from '@/lib/auth/token-store';
import { PasswordStrength } from './PasswordStrength';
import { Link } from '@/i18n/navigation';

// The backend stores a single `name` (max 100 characters).
const MAX_NAME_LENGTH = 100;
// Sign-in rejects passwords over 128 characters, while registration does not check it:
// without this limit an account could be created that can never sign in.
const MAX_PASSWORD_LENGTH = 128;

function getRegisterErrorMessage(
  error: unknown,
  messages: { emailTaken: string; generic: string },
): string {
  const message = getValidationErrorMessage(error);

  if (message === 'EMAIL_ALREADY_EXISTS') return messages.emailTaken;
  return message ?? messages.generic;
}

export function RegisterForm() {
  const t = useTranslations('RegisterForm');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One flag for the whole submit (register, then sign-in): the two mutations' own loading
  // flags leave a gap between them where the button would be enabled again.
  const [isLoading, setIsLoading] = useState(false);
  const [register] = useMutation(REGISTER_MUTATION);
  const [login] = useMutation(LOGIN_MUTATION);
  const router = useRouter();

  const fullName = `${firstName.trim()} ${lastName.trim()}`;

  const validateForm = (): boolean => {
    if (!firstName.trim()) {
      setError(t('errors.firstNameRequired'));
      return false;
    }
    if (!lastName.trim()) {
      setError(t('errors.lastNameRequired'));
      return false;
    }
    if (fullName.length > MAX_NAME_LENGTH) {
      setError(t('errors.nameTooLong', { max: MAX_NAME_LENGTH }));
      return false;
    }
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
    if (password.length < 8) {
      setError(t('errors.passwordTooShort'));
      return false;
    }
    if (password.length > MAX_PASSWORD_LENGTH) {
      setError(t('errors.passwordTooLong', { max: MAX_PASSWORD_LENGTH }));
      return false;
    }
    if (!agreedToTerms) {
      setError(t('errors.termsRequired'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        variables: {
          input: {
            name: fullName,
            email: email.trim(),
            password,
          },
        },
      });

      try {
        const { data: loginData } = await login({
          variables: {
            input: {
              email: email.trim(),
              password,
            },
          },
        });

        const loginRes = loginData?.login;
        if (loginRes && !loginRes.requiresMfa && loginRes.accessToken) {
          setAccessToken(loginRes.accessToken);
          router.replace('/');
          return;
        }
      } catch {
        // Registration succeeded, sign-in failed. Redirect to login.
      }

      router.replace('/login?registered=1');
    } catch (registerError) {
      setError(
        getRegisterErrorMessage(registerError, {
          emailTaken: t('errors.emailTaken'),
          generic: t('errors.generic'),
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cormorant text-text-primary text-display-title">{t('title')}</h2>
        <p className="mt-2 text-ui-label text-text-secondary">{t('subtitle')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-ui-nav text-text-muted">{t('firstName')}</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t('firstNamePlaceholder')}
              maxLength={MAX_NAME_LENGTH}
              className="border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-ui-label text-text-primary outline-none transition-colors"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-ui-nav text-text-muted">{t('lastName')}</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t('lastNamePlaceholder')}
              maxLength={MAX_NAME_LENGTH}
              className="border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-ui-label text-text-primary outline-none transition-colors"
            />
          </div>
        </div>

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
              maxLength={MAX_PASSWORD_LENGTH}
              className="border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 pr-10 text-left text-ui-label text-text-primary outline-none transition-colors"
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
          <PasswordStrength password={password} />
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="accent-brand-dark mt-0.5 h-3.5 w-3.5 cursor-pointer"
          />

          <label
            htmlFor="terms"
            className="cursor-pointer text-ui-label leading-relaxed text-text-secondary"
          >
            {t.rich('terms', {
              terms: (chunks) => (
                <Link
                  href="/legal/terms-of-service"
                  className="border-b border-border-default text-text-primary transition-colors hover:border-text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {chunks}
                </Link>
              ),

              privacy: (chunks) => (
                <Link
                  href="/legal/privacy-policy"
                  className="border-b border-border-default text-text-primary transition-colors hover:border-text-primary"
                  onClick={(e) => e.stopPropagation()}
                >
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>

        {/* Error Message */}
        {error && <p className="text-ui-label text-brand-accent">{error}</p>}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
        >
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </form>
    </div>
  );
}
