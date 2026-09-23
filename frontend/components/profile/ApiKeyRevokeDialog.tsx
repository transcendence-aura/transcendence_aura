'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/form/button';
import { useToast } from '@/components/ui/feedback/toast';
import { Dialog } from '@/components/ui/overlay/dialog';
import { ApiKeyError, revokeApiKey } from '@/lib/api-keys/api-keys';

interface ApiKeyRevokeDialogProps {
  // The key to revoke, or null when the dialog is closed.
  keyId: string | null;
  onClose: () => void;
  onRevoked: () => void;
}

export function ApiKeyRevokeDialog({ keyId, onClose, onRevoked }: ApiKeyRevokeDialogProps) {
  const t = useTranslations('ApiKeys');

  return (
    <Dialog
      isOpen={keyId !== null}
      onClose={onClose}
      title={t('revokeTitle')}
      description={t('revokeDescription')}
    >
      {/* Mounted only while open, so a previous error does not linger. */}
      {keyId !== null && <RevokeActions keyId={keyId} onClose={onClose} onRevoked={onRevoked} />}
    </Dialog>
  );
}

function RevokeActions({
  keyId,
  onClose,
  onRevoked,
}: {
  keyId: string;
  onClose: () => void;
  onRevoked: () => void;
}) {
  const t = useTranslations('ApiKeys');
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const handleRevoke = async () => {
    setIsRevoking(true);
    setError(null);

    try {
      await revokeApiKey(keyId);
    } catch (revokeError) {
      const code = revokeError instanceof ApiKeyError ? revokeError.code : 'failed';
      // Already gone: the goal is reached, the list only needs refreshing.
      if (code !== 'notFound') {
        setError(t(`errors.${code}`));
        setIsRevoking(false);
        return;
      }
    }

    toast({ message: t('revoked'), variant: 'success' });
    onRevoked();
  };

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-status-error text-body-sm">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isRevoking}
          className="text-ui-button uppercase"
        >
          {t('cancel')}
        </Button>
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isRevoking}
          className="bg-status-error text-text-inverse cursor-pointer rounded-none px-6 py-3 uppercase transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus disabled:cursor-not-allowed disabled:opacity-40 text-ui-button uppercase"
        >
          {isRevoking ? t('revoking') : t('revokeConfirm')}
        </button>
      </div>
    </div>
  );
}
