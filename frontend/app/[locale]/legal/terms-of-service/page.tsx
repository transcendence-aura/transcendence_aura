// export default function TermsOfServicePage() {
//   return (
//     <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
//       <h1 className="font-serif text-3xl md:text-4xl text-(--color-brand-dark)">
//         Terms of Service
//       </h1>
//       <p className="mt-4 text-sm text-(--color-brand-muted) tracking-wide">
//         Page under construction.
//       </p>
//     </main>
//   );
// }

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
