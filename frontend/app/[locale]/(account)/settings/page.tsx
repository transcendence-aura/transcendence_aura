import { ProfileSettings } from '@/components/profile/ProfileSettings';
import { FONT_SANS, TEXT_LABEL, TEXT_TITLE } from '@/lib/typography';

export default function SettingsPage() {
  return (
    // Full-width background (the root layout already provides the <main> landmark).
    <div className={`bg-page min-h-screen ${FONT_SANS}`}>
      <div className="w-full px-6 py-10 md:px-8">
        <p className={`text-text-muted ${TEXT_LABEL}`}>Account</p>
        <h1 className={`text-text-primary ${TEXT_TITLE}`}>Settings</h1>

        <div className="mt-8">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
