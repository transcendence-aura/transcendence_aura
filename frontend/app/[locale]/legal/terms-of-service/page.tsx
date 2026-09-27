import { notFound } from 'next/navigation';

import PrivacyPolicyEn from '@/components/legal/terms-of-service/TermsOfServiceEn';
import PrivacyPolicyFr from '@/components/legal/terms-of-service/TermsOfServiceFr';
import PrivacyPolicyAr from '@/components/legal/terms-of-service/TermsOfServiceAr';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function TermsOfServicePage({ params }: Props) {
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
