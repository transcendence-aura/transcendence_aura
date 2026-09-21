'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';

export const HeroSection = () => {
  const t = useTranslations('Hero');

  return (
    <section className="bg-page py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 md:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          {/* Left: Editorial Text on bg-page */}
          <div className="space-y-6">
            <h1 className="font-cormorant text-text-primary">
              <span className="block text-5xl md:text-6xl font-light leading-tight">
                {t('titleLine1')}
              </span>
              <span className="block text-5xl md:text-6xl font-light italic leading-tight">
                {t('titleLine2')}
              </span>
              <span className="block text-5xl md:text-6xl font-light leading-tight">
                {t('titleLine3')}
              </span>
            </h1>
            <p className="text-body-base text-text-secondary max-w-md">{t('tagline')}</p>
            <div className="flex items-center gap-8 pt-4">
              <a
                href="#"
                className="text-ui-button text-text-primary uppercase tracking-wide hover:text-text-primary/70 transition-opacity"
              >
                {t('discover')}
              </a>
              <span className="text-text-muted">|</span>

              <a
                href="#"
                className="text-ui-button text-text-muted uppercase tracking-wide hover:text-text-primary transition-colors"
              >
                {t('story')}
              </a>
            </div>
          </div>

          {/* Right: Hero Image on bg-surface */}
          <div className="flex items-center justify-center bg-surface rounded-none overflow-hidden aspect-square">
            <Image
              src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=800&q=80"
              alt={t('imageAlt')}
              width={400}
              height={400}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
