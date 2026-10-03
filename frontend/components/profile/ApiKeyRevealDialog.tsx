'use client';

import { useState } from 'react';
import { Check, Copy, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/form/button';
import { useToast } from '@/components/ui/feedback/toast';
import { Dialog } from '@/components/ui/overlay/dialog';
import { ApiDocsLink } from './ApiDocsLink';

interface ApiKeyRevealDialogProps {
  // The raw key, or null when there is nothing to show (the dialog is closed).
  apiKey: string | null;
  onDone: () => void;
}

// Shows the raw key, once. Only the "done" button closes it: leaving by mistake (Escape, a click
// outside) would lose a key that can never be displayed again.
export function ApiKeyRevealDialog({ apiKey, onDone }: ApiKeyRevealDialogProps) {
  const t = useTranslations('ApiKeys');

  return (
    <Dialog isOpen={apiKey !== null} onClose={onDone} title={t('revealTitle')} dismissible={false}>
      {apiKey !== null && <RevealContent apiKey={apiKey} onDone={onDone} />}
    </Dialog>
  );
}

function RevealContent({ apiKey, onDone }: { apiKey: string; onDone: () => void }) {
  const t = useTranslations('ApiKeys');
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setIsCopied(true);
    } catch {
      toast({ message: t('copyFailed'), variant: 'error', duration: 5000 });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div
        role="alert"
        className="bg-subtle border-border-default flex items-start gap-3 border p-4"
      >
        <TriangleAlert aria-hidden="true" className="text-text-primary mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex flex-col gap-1">
          <p className="text-text-primary text-ui-label uppercase">{t('warningTitle')}</p>
          <p className="text-text-secondary text-body-sm">{t('warning')}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-text-muted text-ui-label uppercase">{t('keyLabel')}</p>
        <div className="flex items-stretch gap-2">
          <code
            dir="ltr"
            className="bg-card border-border-default text-text-primary min-w-0 flex-1 border px-4 py-3 break-all select-all text-body-base"
          >
            {apiKey}
          </code>
          <Button
            type="button"
            variant="ghost"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-2 text-ui-button uppercase"
          >
            {isCopied ? (
              <Check aria-hidden="true" className="h-4 w-4" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            {isCopied ? t('copied') : t('copy')}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-text-muted text-body-sm">{t('docsNext')}</p>
          <div>
            <ApiDocsLink>{t('docsLink')}</ApiDocsLink>
          </div>
        </div>
        <Button type="button" onClick={onDone} className="text-ui-button uppercase">
          {t('done')}
        </Button>
      </div>
    </div>
  );
}
