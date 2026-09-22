'use client';

import { useState } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/display/badge';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import { Button } from '@/components/ui/form/button';
import { getActiveApiKey } from '@/lib/api-keys/api-keys';
import { useMyApiKeys } from '@/lib/hooks/useMyApiKeys';
import { TEXT_BADGE, TEXT_BODY, TEXT_BUTTON } from '@/lib/typography';
import { ApiDocsLink } from './ApiDocsLink';
import { ApiKeyCreateDialog } from './ApiKeyCreateDialog';
import { ApiKeyRevealDialog } from './ApiKeyRevealDialog';
import { ApiKeyRevokeDialog } from './ApiKeyRevokeDialog';
import { SettingsRow, SettingsSection } from './SettingsSection';

export function ApiKeySection() {
  const t = useTranslations('ApiKeys');
  const format = useFormatter();
  const { keys, isLoading, hasError, refetch } = useMyApiKeys();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // The raw key of the key that was just created. Dropped as soon as the reveal dialog is closed.
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const activeKey = keys ? getActiveApiKey(keys) : undefined;

  const handleRetry = async () => {
    setIsRetrying(true);
    await refetch();
    setIsRetrying(false);
  };

  return (
    <SettingsSection title={t('title')} hint={t('hint')}>
      <div>
        <ApiDocsLink>{t('docsLink')}</ApiDocsLink>
      </div>

      {isLoading && <Skeleton className="h-16 w-full" />}

      {hasError && !keys && (
        <div className="flex flex-col items-start gap-4">
          <p className={`text-text-muted ${TEXT_BODY}`}>{t('loadFailed')}</p>
          <Button onClick={handleRetry} disabled={isRetrying} className={TEXT_BUTTON}>
            {isRetrying ? t('retrying') : t('retry')}
          </Button>
        </div>
      )}

      {keys && !activeKey && (
        <SettingsRow label={t('rowLabel')} description={t('rowDescription')}>
          <Button type="button" onClick={() => setIsCreateOpen(true)} className={TEXT_BUTTON}>
            {t('create')}
          </Button>
        </SettingsRow>
      )}

      {activeKey && (
        <SettingsRow
          label={activeKey.name}
          description={`${t('createdOn', {
            date: format.dateTime(new Date(activeKey.createdAt), { dateStyle: 'medium' }),
          })} · ${t('personalReminder')}`}
        >
          <Badge variant="muted" className={TEXT_BADGE}>
            {t('active')}
          </Badge>
          <Button
            type="button"
            variant="link"
            onClick={() => setKeyToRevoke(activeKey.id)}
            className={TEXT_BUTTON}
          >
            {t('revoke')}
          </Button>
        </SettingsRow>
      )}

      <p className="sr-only" aria-live="polite">
        {keys && (activeKey ? t('active') : t('rowDescription'))}
      </p>

      <ApiKeyCreateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(created) => {
          setIsCreateOpen(false);
          setRevealedKey(created.key);
          void refetch();
        }}
      />
      <ApiKeyRevealDialog apiKey={revealedKey} onDone={() => setRevealedKey(null)} />
      <ApiKeyRevokeDialog
        keyId={keyToRevoke}
        onClose={() => setKeyToRevoke(null)}
        onRevoked={() => {
          setKeyToRevoke(null);
          void refetch();
        }}
      />
    </SettingsSection>
  );
}
