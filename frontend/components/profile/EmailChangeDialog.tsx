'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/form/button';
import { FormField } from '@/components/ui/form/form-field';
import { Input } from '@/components/ui/form/input';
import { Dialog } from '@/components/ui/overlay/dialog';
import { useToast } from '@/components/ui/feedback/toast';
import { getProfileServerError, validateEmail } from '@/lib/profile/profile-fields';
import { UPDATE_MY_PROFILE_MUTATION } from '@/lib/graphql/queries/profile';

interface EmailChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

// The dialog renders nothing while closed, so the form (and its state) starts fresh each time.
export function EmailChangeDialog({ isOpen, onClose, currentEmail }: EmailChangeDialogProps) {
  const t = useTranslations('EmailChangeDialog');

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={t('title')} description={t('description')}>
      <EmailChangeForm currentEmail={currentEmail} onClose={onClose} />
    </Dialog>
  );
}

function EmailChangeForm({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const t = useTranslations('EmailChangeDialog');
  const tFields = useTranslations('ProfileFields');
  const { toast } = useToast();
  const [updateProfile, { loading: isSaving }] = useMutation(UPDATE_MY_PROFILE_MUTATION);
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(tFields(validationError.code, { max: validationError.max ?? 0 }));
      return;
    }
    if (email.trim().toLowerCase() === currentEmail.toLowerCase()) {
      setError(t('sameEmail'));
      return;
    }

    try {
      await updateProfile({ variables: { input: { email: email.trim() } } });
      toast({ message: t('updated'), variant: 'success' });
      onClose();
    } catch (serverError) {
      const { error: fieldError } = getProfileServerError(serverError);
      setError(tFields(fieldError.code, { max: fieldError.max ?? 0 }));
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
      <FormField label={t('emailAddress')} htmlFor="email-change" error={error ?? undefined}>
        <Input
          id="email-change"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'email-change-error' : undefined}
          className="text-body-base"
        />
      </FormField>

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
