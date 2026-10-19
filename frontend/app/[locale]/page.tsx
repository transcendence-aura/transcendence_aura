import { HeroSection } from '@/components/sections/HeroSection';
import { FeaturedCollectionsSection } from '@/components/sections/FeaturedCollectionsSection';
import { CallToActionSection } from '@/components/sections/CallToActionSection';

export default function LandingPage() {
  return (
    <main>
      <HeroSection />
      <FeaturedCollectionsSection />
      <CallToActionSection />
    </main>
  );
}
