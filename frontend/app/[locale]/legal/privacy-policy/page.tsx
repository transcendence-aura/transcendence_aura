// export default function PrivacyPolicyPage() {
//   return (
//     <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
//       <h1 className="font-serif text-3xl md:text-4xl text-(--color-brand-dark)">Privacy Policy</h1>
//       <p className="mt-4 text-sm text-(--color-brand-muted) tracking-wide">
//         Page under construction.
//       </p>
//     </main>
//   );
// }

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
