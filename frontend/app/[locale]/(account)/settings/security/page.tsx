'use client';

import { TwoFactorEnrollment } from '@/components/auth/TwoFactorEnrollment';
import { useQuery } from '@apollo/client/react';
import { TWO_FACTOR_STATUS } from '@/lib/graphql/queries/two-factor';
import { useTranslations } from 'next-intl';

export default function SecurityPage() {
  const { data, loading, error } = useQuery(TWO_FACTOR_STATUS);
  const t = useTranslations('SecurityPage');
  if (loading) {
    return <p>{t('loading')}</p>;
  }

  if (error || !data?.twoFactorStatus) {
    return <p>{t('loadError')}</p>;
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <div>
        <h1 className="text-display-title font-cormorant font-semibold">{t('title')}</h1>

        <p className="mt-2 text-body-sm text-neutral-600">{t('subtitle')}</p>
      </div>

      <div className="mt-8">
        <TwoFactorEnrollment initiallyEnabled={data.twoFactorStatus.enabled} />
      </div>
    </main>
  );
}
