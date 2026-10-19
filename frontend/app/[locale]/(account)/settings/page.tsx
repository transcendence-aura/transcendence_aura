import { getTranslations } from 'next-intl/server';
import { ProfileHeaderSection } from '@/components/profile/ProfileHeaderSection';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

export default async function SettingsPage() {
  const t = await getTranslations('SettingsPage');

  return (
    // Full-width background (the root layout already provides the <main> landmark).
    <div className="bg-page font-jost">
      <ProfileHeaderSection />
      <div className="w-full px-6 py-10 md:px-8">
        <p className="text-text-muted text-ui-label uppercase">{t('eyebrow')}</p>
        <h1 className="text-text-primary font-cormorant text-display-title">{t('title')}</h1>

        <div className="mt-8">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
