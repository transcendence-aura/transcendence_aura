'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { useApolloClient, useMutation } from '@apollo/client/react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/form/button';
import { FormField } from '@/components/ui/form/form-field';
import { Input } from '@/components/ui/form/input';
import { Dialog } from '@/components/ui/overlay/dialog';
import { useRouter } from '@/i18n/navigation';
import { getValidationErrorMessage } from '@/lib/graphql-error';
import { CHANGE_PASSWORD_MUTATION } from '@/lib/graphql/queries/auth';
import { clearAccessToken } from '@/lib/auth/token-store';
import { PasswordStrength } from '@/components/auth/PasswordStrength';

// Same limits as the backend (ChangePasswordInput).
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

interface PasswordChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type FieldErrors = Partial<Record<keyof PasswordValues, string | undefined>>;
type FieldVisibility = Record<keyof PasswordValues, boolean>;

const EMPTY_VALUES: PasswordValues = { currentPassword: '', newPassword: '', confirmPassword: '' };
const HIDDEN_VALUES: FieldVisibility = {
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
};

// Each of the three fields toggles independently, and the wrapping `relative`/`pe-10` pairing to
// fit the eye button is the same each time, hence the shared field instead of repeating it 3x.
function PasswordField({
  id,
  label,
  autoComplete,
  value,
  error,
  visible,
  onChange,
  onToggleVisible,
  t,
  children,
}: {
  id: string;
  label: string;
  autoComplete: string;
  value: string;
  error?: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggleVisible: () => void;
  t: ReturnType<typeof useTranslations>;
  children?: ReactNode;
}) {
  return (
    <FormField label={label} htmlFor={id} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          className="pe-10 text-body-base"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="text-text-muted hover:text-text-primary absolute top-1/2 end-3 -translate-y-1/2"
          aria-label={visible ? t('hidePassword') : t('showPassword')}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {children}
    </FormField>
  );
}

// The dialog renders nothing while closed, so the form (and its state) starts fresh each time.
export function PasswordChangeDialog({ isOpen, onClose }: PasswordChangeDialogProps) {
  const t = useTranslations('PasswordChangeDialog');

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('title')} description={t('description')}>
      <PasswordChangeForm onClose={onClose} />
    </Dialog>
  );
}

function PasswordChangeForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('PasswordChangeDialog');
  const router = useRouter();
  const client = useApolloClient();
  const [changePassword, { loading: isSaving }] = useMutation(CHANGE_PASSWORD_MUTATION);
  const [values, setValues] = useState<PasswordValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [visible, setVisible] = useState<FieldVisibility>(HIDDEN_VALUES);

  const handleChange = (field: keyof PasswordValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setGeneralError(null);
  };

  const toggleVisible = (field: keyof PasswordValues) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
  };

  const validate = (): FieldErrors => {
    const fieldErrors: FieldErrors = {};

    if (!values.currentPassword) {
      fieldErrors.currentPassword = t('currentPasswordRequired');
    }
    if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
      fieldErrors.newPassword = t('passwordTooShort', { min: MIN_PASSWORD_LENGTH });
    } else if (values.newPassword.length > MAX_PASSWORD_LENGTH) {
      fieldErrors.newPassword = t('passwordTooLong', { max: MAX_PASSWORD_LENGTH });
    }
    if (values.confirmPassword !== values.newPassword) {
      fieldErrors.confirmPassword = t('passwordsDoNotMatch');
    }

    return fieldErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);

    const validationErrors = validate();
    if (Object.values(validationErrors).some(Boolean)) {
      setErrors(validationErrors);
      return;
    }

    try {
      await changePassword({
        variables: {
          input: {
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          },
        },
      });
      // The backend just revoked every session for this account, this one included:
      // sign out locally too and send the user back to sign in, same as a manual logout.
      clearAccessToken({ byUser: true });
      await client.clearStore();
      router.push('/login?passwordChanged=1');
    } catch (serverError) {
      const message = getValidationErrorMessage(serverError);
      if (message === 'INVALID_CURRENT_PASSWORD') {
        setErrors({ currentPassword: t('invalidCurrentPassword') });
      } else {
        setGeneralError(t('updateFailed'));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <PasswordField
        id="password-change-current"
        label={t('currentPassword')}
        autoComplete="current-password"
        value={values.currentPassword}
        error={errors.currentPassword}
        visible={visible.currentPassword}
        onChange={(value) => handleChange('currentPassword', value)}
        onToggleVisible={() => toggleVisible('currentPassword')}
        t={t}
      />

      <PasswordField
        id="password-change-new"
        label={t('newPassword')}
        autoComplete="new-password"
        value={values.newPassword}
        error={errors.newPassword}
        visible={visible.newPassword}
        onChange={(value) => handleChange('newPassword', value)}
        onToggleVisible={() => toggleVisible('newPassword')}
        t={t}
      >
        <PasswordStrength password={values.newPassword} />
      </PasswordField>

      <PasswordField
        id="password-change-confirm"
        label={t('confirmPassword')}
        autoComplete="new-password"
        value={values.confirmPassword}
        error={errors.confirmPassword}
        visible={visible.confirmPassword}
        onChange={(value) => handleChange('confirmPassword', value)}
        onToggleVisible={() => toggleVisible('confirmPassword')}
        t={t}
      />

      {generalError && (
        <p role="alert" className="text-status-error text-body-sm">
          {generalError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="text-ui-button uppercase"
        >
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isSaving} className="text-ui-button uppercase">
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
