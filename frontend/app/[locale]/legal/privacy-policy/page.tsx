import { notFound } from 'next/navigation';

import PrivacyPolicyEn from '@/components/legal/privacy-policy/PrivacyPolicyEn';
import PrivacyPolicyFr from '@/components/legal/privacy-policy/PrivacyPolicyFr';
import PrivacyPolicyAr from '@/components/legal/privacy-policy/PrivacyPolicyAr';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function PrivacyPolicyPage({ params }: Props) {
  const { locale } = await params;

  switch (locale) {
    case 'fr':
      return <PrivacyPolicyFr />;

    case 'ar':
      return <PrivacyPolicyAr />;

    case 'en':
      return <PrivacyPolicyEn />;

    default:
      notFound();
  }
}
