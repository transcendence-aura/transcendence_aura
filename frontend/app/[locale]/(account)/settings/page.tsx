import { getTranslations } from 'next-intl/server';
import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { FONT_SANS, TEXT_LABEL, TEXT_TITLE } from '@/lib/typography';

export default async function SettingsPage() {
  const t = await getTranslations('SettingsPage');

  return (
    // Full-width background (the root layout already provides the <main> landmark).
    <div className={`bg-page ${FONT_SANS}`}>
      <div className="w-full px-6 py-10 md:px-8">
        <p className={`text-text-muted ${TEXT_LABEL}`}>{t('eyebrow')}</p>
        <h1 className={`text-text-primary ${TEXT_TITLE}`}>{t('title')}</h1>

        <div className="mt-8">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
