'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@apollo/client/react';
import Image from 'next/image';
import { Button } from '@/components/ui/form/button';

import {
  CONFIRM_TWO_FACTOR_MUTATION,
  SETUP_TWO_FACTOR_MUTATION,
  DISABLE_TWO_FACTOR_MUTATION,
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

type TwoFactorEnrollmentProps = {
  initiallyEnabled: boolean;
};

export function TwoFactorEnrollment({ initiallyEnabled }: TwoFactorEnrollmentProps) {
  const t = useTranslations('TwoFactorEnrollment');
  const [code, setCode] = useState('');
  const [setup, setSetup] = useState<{
    provisioningUri: string;
    qrCode: string;
  } | null>(null);
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [error, setError] = useState<string | null>(null);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);

  const [setupTwoFactor, { loading: setupLoading }] =
    useMutation<SetupTwoFactorData>(SETUP_TWO_FACTOR_MUTATION);

  const [confirmTwoFactor, { loading: confirmLoading }] = useMutation<
    ConfirmTwoFactorData,
    ConfirmTwoFactorVariables
  >(CONFIRM_TWO_FACTOR_MUTATION);

  const [disableTwoFactor, { loading: disableLoading }] = useMutation(DISABLE_TWO_FACTOR_MUTATION);

  const handleBeginEnrollment = async () => {
    setError(null);

    try {
      const { data } = await setupTwoFactor();

      const result = data?.setupTwoFactor;

      if (!result) {
        setError(t('errors.setupFailed'));
        return;
      }

      setSetup(result);
      setCode('');
    } catch {
      setError(t('errors.setupFailed'));
    }
  };

  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(t('errors.codeFormat'));
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
        setError(t('errors.enableFailed'));
        return;
      }

      setEnabled(true);

      // Remove enrollment info from React state.
      setSetup(null);
      setCode('');
    } catch {
      setError(t('errors.codeInvalid'));
    }
  };

  const handleDisable = async () => {
    if (!/^\d{6}$/.test(disableCode)) {
      setError(t('errors.codeFormat'));
      return;
    }

    setError(null);

    try {
      const { data } = await disableTwoFactor({
        variables: {
          input: {
            code: disableCode,
          },
        },
      });

      if (data?.disableTwoFactor.enabled !== false) {
        setError(t('errors.disableFailed'));
        return;
      }

      setEnabled(false);
      setShowDisableForm(false);
      setDisableCode('');
      setSetup(null);
    } catch {
      setError(t('errors.disableFailed'));
    }
  };

  if (enabled) {
    return (
      <div>
        <div className="mb-5 flex items-center gap-2.5">
          <CheckCircle2 className="h-5 w-5 text-status-online" />

          <h2 className="font-cormorant text-display-title font-normal text-text-primary">
            {t('enabledTitle')}
          </h2>
        </div>

        <p className="text-ui-label leading-relaxed text-text-secondary">{t('enabledSubtitle')}</p>

        <div className="mt-6 flex items-start gap-2.5 bg-bg-subtle p-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-online" />

          <p className="text-body-base leading-relaxed text-text-secondary">{t('enabledNotice')}</p>
        </div>

        {!showDisableForm ? (
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setShowDisableForm(true);
            }}
            className="bg-brand-dark hover:bg-brand-dark/90 mt-6 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
          >
            {t('disable')}
          </Button>
        ) : (
          <form
            className="mt-6 space-y-4"
            aria-busy={disableLoading}
            onSubmit={async (event) => {
              event.preventDefault();
              await handleDisable();
            }}
          >
            <div>
              <label
                htmlFor="disable-two-factor-code"
                className="mb-1.5 block text-ui-nav text-text-muted"
              >
                {t('disableCodeLabel')}
              </label>

              <input
                id="disable-two-factor-code"
                name="disable-two-factor-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={disableCode}
                onChange={(event) => {
                  setDisableCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                }}
                placeholder="123456"
                required
                autoFocus
                disabled={disableLoading}
                className={`border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-ui-label tracking-[0.35em] text-text-primary outline-none transition-colors disabled:opacity-50 ${
                  error ? 'border-brand-accent' : ''
                }`}
              />
            </div>

            {error && (
              <p role="alert" className="text-ui-label text-brand-accent">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={disableLoading || disableCode.length !== 6}
              className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
            >
              {disableLoading ? t('disabling') : t('confirmDisable')}
            </Button>

            <button
              type="button"
              onClick={() => {
                setShowDisableForm(false);
                setDisableCode('');
                setError(null);
              }}
              className="w-full text-ui-label text-text-muted transition-colors hover:text-text-primary"
            >
              {t('cancelDisable')}
            </button>
          </form>
        )}
      </div>
    );
  }

  if (!setup) {
    return (
      <div>
        <h2 className="font-cormorant mb-1.5 text-display-title font-cormorant font-normal text-text-primary">
          {t('title')}
        </h2>

        <p className="mb-6 text-ui-label leading-relaxed text-text-secondary">{t('subtitle')}</p>

        {error && (
          <p role="alert" className="mb-4 text-ui-label text-brand-accent">
            {error}
          </p>
        )}

        <Button
          type="button"
          onClick={handleBeginEnrollment}
          disabled={setupLoading}
          className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
        >
          {setupLoading ? t('starting') : t('start')}
        </Button>

        <div className="mt-6 flex items-start gap-2.5 bg-bg-subtle p-3">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-online" />

          <p className="text-body-base leading-relaxed text-text-secondary">{t('startNotice')}</p>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2 className="font-cormorant mb-1.5 text-display-title font-cormorant font-normal text-text-primary">
        {t('setupTitle')}
      </h2>

      <p className="mb-6 text-ui-label leading-relaxed text-text-secondary">{t('setupSubtitle')}</p>

      <div className="border-border-default flex justify-center border bg-bg-page p-5">
        <Image src={setup.qrCode} alt={t('qrAlt')} width={224} height={224} unoptimized />
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-ui-label text-text-muted transition-colors hover:text-text-primary">
          {t('cannotScan')}
        </summary>

        <div className="mt-3 bg-bg-subtle p-3">
          <p className="mb-1.5 text-ui-label text-text-secondary">{t('manualEntry')}</p>

          <p className="break-all text-body-sm leading-relaxed text-text-muted">
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
          <label htmlFor="two-factor-code" className="mb-1.5 block text-ui-nav text-text-muted">
            {t('codeLabel')}
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
            className={`border-border-default focus:border-border-focus w-full border bg-bg-page px-3.5 py-2.5 text-ui-label tracking-[0.35em] text-text-primary outline-none transition-colors disabled:opacity-50 ${
              error ? 'border-brand-accent' : ''
            }`}
          />
        </div>

        {error && (
          <p role="alert" className="text-ui-label text-brand-accent">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={confirmLoading || code.length !== 6}
          className="bg-brand-dark hover:bg-brand-dark/90 w-full py-3 text-ui-label font-medium uppercase tracking-wider text-white"
        >
          {confirmLoading ? t('confirming') : t('confirm')}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-2.5 bg-bg-subtle p-3">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-online" />

        <p className="text-body-base leading-relaxed text-text-secondary">{t('confirmNotice')}</p>
      </div>
    </div>
  );
}
