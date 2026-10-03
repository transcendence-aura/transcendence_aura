'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@apollo/client/react';
import { Button } from '@/components/ui/form/button';
import { FormField } from '@/components/ui/form/form-field';
import { Input } from '@/components/ui/form/input';
import { Textarea } from '@/components/ui/form/textarea';
import { useToast } from '@/components/ui/feedback/toast';
import {
  BIO_MAX_LENGTH,
  getProfileServerError,
  normalizeHandle,
  type FieldError,
  splitName,
  validateBio,
  validateHandle,
} from '@/lib/profile/profile-fields';
import {
  UPDATE_MY_PROFILE_MUTATION,
  type UpdateMyProfileInput,
} from '@/lib/graphql/queries/profile';

export interface ProfileValues {
  handle: string;
  bio: string;
}

type FieldErrors = Partial<Record<keyof ProfileValues, FieldError | undefined>>;

// Only the fields being changed: a saved value that predates a rule (an older handle, say) must
// not block saving something else.
function validate(changes: UpdateMyProfileInput): FieldErrors {
  return {
    handle: changes.handle !== undefined ? validateHandle(changes.handle) : undefined,
    bio: changes.bio !== undefined ? validateBio(changes.bio) : undefined,
  };
}

function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// Only what differs from the saved profile.
function getChanges(initial: ProfileValues, values: ProfileValues): UpdateMyProfileInput {
  const changes: UpdateMyProfileInput = {};

  // Compared as typed first: an untouched handle is left alone, even one that normalizing would alter.
  if (values.handle.trim() !== initial.handle) changes.handle = normalizeHandle(values.handle);
  if (values.bio !== initial.bio) changes.bio = values.bio;

  return changes;
}

// `initial` is the saved profile: the parent remounts the form (new `key`) once a save succeeds,
// so the fields always start from what the server stored.
// The name is shown but not editable: the backend has no way to change it yet.
export function ProfileForm({ initial, name }: { initial: ProfileValues; name: string }) {
  const t = useTranslations('ProfileForm');
  const tFields = useTranslations('ProfileFields');
  const { toast } = useToast();
  const [updateProfile, { loading: isSaving }] = useMutation(UPDATE_MY_PROFILE_MUTATION);
  const [values, setValues] = useState<ProfileValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const { firstName, lastName } = splitName(name);
  const errorText = (error?: FieldError) =>
    error ? tFields(error.code, { max: error.max ?? 0 }) : undefined;
  const changes = getChanges(initial, values);
  const isDirty = Object.keys(changes).length > 0;

  const handleChange = (field: keyof ProfileValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setGeneralError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setGeneralError(null);

    const validationErrors = validate(changes);
    if (hasErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    try {
      await updateProfile({ variables: { input: changes } });
      toast({ message: t('updated'), variant: 'success' });
    } catch (error) {
      const serverError = getProfileServerError(error);

      if (serverError.field === 'handle') {
        setErrors({ handle: serverError.error });
      } else {
        setGeneralError(errorText(serverError.error) ?? null);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField label={t('firstName')} htmlFor="profile-first-name">
          <Input
            id="profile-first-name"
            value={firstName}
            disabled
            readOnly
            className="text-body-base"
          />
        </FormField>
        <FormField label={t('lastName')} htmlFor="profile-last-name" hint={t('nameLocked')}>
          <Input
            id="profile-last-name"
            value={lastName}
            disabled
            readOnly
            className="text-body-base"
          />
        </FormField>
      </div>

      <FormField label={t('username')} htmlFor="profile-handle" error={errorText(errors.handle)}>
        <div className="relative">
          <span
            aria-hidden="true"
            className="text-text-muted pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-body-base"
          >
            @
          </span>
          <Input
            id="profile-handle"
            type="text"
            autoComplete="off"
            value={values.handle}
            onChange={(event) => handleChange('handle', event.target.value.replace(/^@+/, ''))}
            error={Boolean(errors.handle)}
            aria-invalid={Boolean(errors.handle)}
            aria-describedby={errors.handle ? 'profile-handle-error' : undefined}
            className="ps-8 text-body-base"
          />
        </div>
      </FormField>

      <FormField
        label={t('bio')}
        htmlFor="profile-bio"
        error={errorText(errors.bio)}
        hint={`${values.bio.length}/${BIO_MAX_LENGTH}`}
      >
        <Textarea
          id="profile-bio"
          rows={2}
          value={values.bio}
          onChange={(event) => handleChange('bio', event.target.value)}
          error={Boolean(errors.bio)}
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={errors.bio ? 'profile-bio-error' : undefined}
          className="text-body-base"
        />
      </FormField>

      {generalError && (
        <p role="alert" className="text-status-error text-body-sm">
          {generalError}
        </p>
      )}

      <div>
        <Button
          type="submit"
          variant="link"
          disabled={isSaving || !isDirty}
          className="text-ui-button uppercase"
        >
          {isSaving ? t('saving') : t('save')}
        </Button>
      </div>
    </form>
  );
}
