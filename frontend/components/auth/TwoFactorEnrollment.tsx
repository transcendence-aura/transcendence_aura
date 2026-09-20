'use client';

import { useState } from 'react';
import { useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/form/button';

import {
  CONFIRM_TWO_FACTOR_MUTATION,
  SETUP_TWO_FACTOR_MUTATION,
} from '@/lib/auth/two-factor.mutations';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

type SetupTwoFactorData = {
  setupTwoFactor: {
    provisioningUri: string;
    qrCode: string;
  };
};

type ConfirmTwoFactorData = {
  confirmTwoFactor: {
    enabled: boolean;
  };
};

type ConfirmTwoFactorVariables = {
  input: {
    code: string;
  };
};

export function TwoFactorEnrollment() {
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{
    provisioningUri: string;
    qrCode: string;
  } | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [setupTwoFactor, { loading: setupLoading }] =
    useMutation<SetupTwoFactorData>(SETUP_TWO_FACTOR_MUTATION);

  const [confirmTwoFactor, { loading: confirmLoading }] = useMutation<
    ConfirmTwoFactorData,
    ConfirmTwoFactorVariables
  >(CONFIRM_TWO_FACTOR_MUTATION);

  const handleBeginEnrollment = async () => {
    setError(null);

    try {
      const { data } = await setupTwoFactor();

      const result = data?.setupTwoFactor;

      if (!result) {
        setError('Unable to start two-factor authentication setup.');
        return;
      }

      setSetup(result);
      setCode('');
    } catch {
      setError('Unable to start two-factor authentication setup.');
    }
  };

  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError('Please enter the 6-digit authentication code.');
      return;
    }

    setError(null);

    try {
      const { data } = await confirmTwoFactor({
        variables: {
          input: {
            code,
          },
        },
      });

      if (!data?.confirmTwoFactor.enabled) {
        setError('Unable to enable two-factor authentication.');
        return;
      }

      setEnabled(true);

      // Remove enrollment info from React state.
      setSetup(null);
      setCode('');
    } catch {
      setError('The authentication code is invalid or has expired.');
    }
  };

  if (enabled) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-[#7a9e8e]" />
          <h2 className="font-cormorant text-3xl font-normal text-text-primary">
            Two-factor authentication enabled
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-text-secondary">
          Your account is now protected with an authenticator app.
        </p>
        <div>
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7a9e8e]" />
          <p className="text-[12px] leading-relaxed text-text-secondary">
            You&apos;ll be asked for an authentication code when signing in to your account.
          </p>
        </div>
      </div>
    );
  }

  if (!setup) {
    return (
      <div>
        <h2 className="font-cormorant mb-1.5 text-3xl font-normal text-text-primary">
          Two-factor authentication
        </h2>

        <p className="mb-6 text-xs leading-relaxed text-text-secondary">
          Add an extra layer of security to your account using an authenticator app.
        </p>

        {error && (
          <p role="alert" className="mb-4 text-xs text-brand-accent">
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={handleBeginEnrollment}
          disabled={setupLoading}
          className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-xs font-medium uppercase tracking-wider text-white"
        >
          {setupLoading ? 'Preparing setup...' : 'Enable two-factor authentication'}
        </Button>

        <div className="mt-6 flex items-start gap-2.5 bg-bg-subtle p-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7a9e8e]" />

          <p className="text-[12px] leading-relaxed text-text-secondary">
            You&apos;ll need an authenticator app to complete setup.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-cormorant mb-1.5 text-3xl font-normal text-text-primary">
        Set up your authenticator app
      </h2>

      <p className="mb-6 text-xs leading-relaxed text-text-secondary">
        Scan the QR code with your authenticator app, then enter the 6-digit code it generates.
      </p>

      <div className="border-border-default flex h-56 items-center justify-center border bg-bg-page p-5">
        <p className="text-xs text-text-muted">Coming soon</p>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-text-muted transition-colors hover:text-text-primary">
          Cannot scan the QR code?
        </summary>

        <div className="mt-3 bg-bg-subtle p-3">
          <p className="mb-1.5 text-xs text-text-secondary">
            Enter this setup URI manually in your authenticator app:
          </p>

          <p className="break-all text-[11px] leading-relaxed text-text-muted">
            {setup.provisioningUri}
          </p>
        </div>
      </details>

      <form
        className="mt-6 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await handleConfirm();
        }}
        aria-busy={confirmLoading}
      >
        <div>
          <label
            htmlFor="two-factor-code"
            className="mb-1.5 block text-xs uppercase tracking-wider text-text-muted"
          >
            Authentication code
          </label>

          <input
            id="two-factor-code"
            name="two-factor-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={(event) => {
              const value = event.target.value.replace(/\D/g, '').slice(0, 6);

              setCode(value);
            }}
            placeholder="123456"
            required
            autoFocus
            disabled={confirmLoading}
            className={`border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-xs tracking-[0.35em] text-text-primary outline-none transition-colors disabled:opacity-50 ${
              error ? 'border-brand-accent' : ''
            }`}
          />
        </div>

        {error && (
          <p role="alert" className="text-xs text-brand-accent">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={confirmLoading || code.length !== 6}
          className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-xs font-medium uppercase tracking-wider text-white"
        >
          {confirmLoading ? 'Verifying...' : 'Confirm and enable 2FA'}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2.5 bg-bg-subtle p-3">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7a9e8e]" />

        <p className="text-[12px] leading-relaxed text-text-secondary">
          Two-factor authentication will only be enabled after the code from your authenticator app
          has been verified.
        </p>
      </div>
    </div>
  );
}
