'use client';

import { useState, type FormEvent } from 'react';
import { useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/form/button';
import { FormField } from '@/components/ui/form/form-field';
import { Input } from '@/components/ui/form/input';
import { Dialog } from '@/components/ui/overlay/dialog';
import { useToast } from '@/components/ui/feedback/toast';
import { getProfileServerError, validateEmail } from '@/lib/profile/profile-fields';
import { UPDATE_MY_PROFILE_MUTATION } from '@/lib/graphql/queries/profile';
import { TEXT_BODY, TEXT_BUTTON } from '@/lib/typography';

interface EmailChangeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

// The dialog renders nothing while closed, so the form (and its state) starts fresh each time.
export function EmailChangeDialog({ isOpen, onClose, currentEmail }: EmailChangeDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Change email address"
      description="Enter the new email address for your account."
    >
      <EmailChangeForm currentEmail={currentEmail} onClose={onClose} />
    </Dialog>
  );
}

function EmailChangeForm({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const { toast } = useToast();
  const [updateProfile, { loading: isSaving }] = useMutation(UPDATE_MY_PROFILE_MUTATION);
  const [email, setEmail] = useState(currentEmail);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (email.trim().toLowerCase() === currentEmail) {
      setError('This is already your email address.');
      return;
    }

    try {
      await updateProfile({ variables: { input: { email: email.trim() } } });
      toast({ message: 'Email address updated', variant: 'success' });
      onClose();
    } catch (serverError) {
      setError(getProfileServerError(serverError).message);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
      <FormField label="Email address" htmlFor="email-change" error={error ?? undefined}>
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
          className={TEXT_BODY}
        />
      </FormField>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} className={TEXT_BUTTON}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className={TEXT_BUTTON}>
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
