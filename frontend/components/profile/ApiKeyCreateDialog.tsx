'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/form/button';
import { FormField } from '@/components/ui/form/form-field';
import { Input } from '@/components/ui/form/input';
import { Dialog } from '@/components/ui/overlay/dialog';
import { ApiKeyError, createApiKey, type CreatedApiKey } from '@/lib/api-keys/api-keys';
import { TEXT_BODY, TEXT_BUTTON } from '@/lib/typography';

// Same limit as the backend (CreateApiKeyDto).
const NAME_MAX_LENGTH = 100;

interface ApiKeyCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (created: CreatedApiKey) => void;
}

export function ApiKeyCreateDialog({ isOpen, onClose, onCreated }: ApiKeyCreateDialogProps) {
  const t = useTranslations('ApiKeys');

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('createTitle')}
      description={t('createDescription')}
    >
      {/* Mounted only while open, so the field starts empty each time. */}
      <CreateForm onClose={onClose} onCreated={onCreated} />
    </Dialog>
  );
}

function CreateForm({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (created: CreatedApiKey) => void;
}) {
  const t = useTranslations('ApiKeys');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('nameRequired'));
      return;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      setError(t('nameTooLong', { max: NAME_MAX_LENGTH }));
      return;
    }

    setIsCreating(true);
    try {
      onCreated(await createApiKey(trimmed));
    } catch (createError) {
      setError(t(`errors.${createError instanceof ApiKeyError ? createError.code : 'failed'}`));
      setIsCreating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-6">
      <FormField label={t('nameLabel')} htmlFor="api-key-name" error={error ?? undefined}>
        <Input
          id="api-key-name"
          autoComplete="off"
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          error={Boolean(error)}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'api-key-name-error' : undefined}
          className={TEXT_BODY}
        />
      </FormField>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onClose} className={TEXT_BUTTON}>
          {t('cancel')}
        </Button>
        <Button type="submit" disabled={isCreating} className={TEXT_BUTTON}>
          {isCreating ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  );
}
