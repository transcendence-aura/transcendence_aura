import { notFound } from 'next/navigation';

import TermsOfSaleEn from '@/components/legal/terms-of-sale/TermsOfSaleEn';
import TermsOfSaleFr from '@/components/legal/terms-of-sale/TermsOfSaleFr';
import TermsOfSaleAr from '@/components/legal/terms-of-sale/TermsOfSaleAr';

type Props = {
  params: Promise<{
    locale: string;
  }>;
};

export default async function TermsOfSalePage({ params }: Props) {
  const { locale } = await params;

  switch (locale) {
    case 'fr':
      return <TermsOfSaleFr />;

    case 'ar':
      return <TermsOfSaleAr />;

    case 'en':
      return <TermsOfSaleEn />;

    default:
      notFound();
  }
}
