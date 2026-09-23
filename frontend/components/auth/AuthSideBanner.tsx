'use client';

import { useTranslations } from 'next-intl';
import { Leaf } from 'lucide-react';

export function AuthSideBanner() {
  const t = useTranslations('AuthSideBanner');

  return (
    <div className="bg-bg-surface relative flex h-full min-h-[calc(100vh-56px)] flex-col items-center justify-center overflow-hidden p-12">
      <Leaf
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-text-primary/5"
        size={160}
        strokeWidth={1}
      />

      <div className="relative z-10 text-center">
        <p className="font-cormorant mb-3 text-display-subtitle font-light italic leading-relaxed text-text-primary">
          {t('quoteLine1')}
          <br />
          {t('quoteLine2')}
        </p>
        <p className="text-ui-lang uppercase font-medium text-status-online">{t('signature')}</p>
      </div>
    </div>
  );
}
