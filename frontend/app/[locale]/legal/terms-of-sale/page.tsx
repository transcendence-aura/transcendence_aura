// export default function TermsOfSalePage() {
//   return (
//     <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
//       <h1 className="font-serif text-3xl md:text-4xl text-(--color-brand-dark)">Terms of Sale</h1>
//       <p className="mt-4 text-sm text-(--color-brand-muted) tracking-wide">
//         Page under construction.
//       </p>
//     </main>
//   );
// }
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
