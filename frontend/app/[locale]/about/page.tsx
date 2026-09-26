import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

const IMAGES = {
  hero: '/images/products/product-rosehip-face-oil.jpg',
  origin: '/images/products/product-vitamin-c-serum.jpg',
  craft: '/images/products/product-barrier-repair-cream.jpg',
  cta: '/images/products/product-nourishing-body-oil.jpg',
};

const PILLARS = [1, 2, 3] as const;

export default function AboutPage() {
  const t = useTranslations('AboutPage');

  return (
    <div className="bg-page text-text-primary">
      {/* 1. Hero section */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_1fr] md:gap-20 md:px-8 md:py-24">
        <div>
          <span className="text-ui-label uppercase tracking-widest text-brand-accent">
            {t('heroTag')}
          </span>
          <h1 className="mt-6 font-cormorant text-5xl font-light leading-[1.05] md:text-7xl">
            {t('heroTitle')}
          </h1>
          <p className="mt-8 max-w-md text-body-lg leading-relaxed text-text-secondary">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="relative aspect-4/5 overflow-hidden bg-card-subtle">
          <Image
            src={IMAGES.hero}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </section>

      {/* Quote */}
      <section className="bg-brand-dark px-6 py-24 md:py-32">
        <blockquote className="mx-auto max-w-4xl text-center font-cormorant text-3xl font-light italic leading-snug text-text-inverse md:text-5xl">
          {t('quote')}
        </blockquote>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-7xl space-y-24 px-6 py-24 md:space-y-32 md:px-8 md:py-32">
        <article className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20">
          <div className="relative aspect-square overflow-hidden bg-card-subtle">
            <Image
              src={IMAGES.origin}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="space-y-5">
            <span className="font-cormorant text-body-lg italic text-brand-accent">I.</span>
            <h2 className="font-cormorant text-4xl font-light md:text-5xl">{t('originTitle')}</h2>
            <p className="text-body-base leading-relaxed text-text-secondary">{t('originP1')}</p>
            <p className="text-body-base leading-relaxed text-text-secondary">{t('originP2')}</p>
          </div>
        </article>

        <article className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-20">
          <div className="space-y-5 md:order-1">
            <span className="font-cormorant text-body-lg italic text-brand-accent">II.</span>
            <h2 className="font-cormorant text-4xl font-light md:text-5xl">{t('craftTitle')}</h2>
            <p className="text-body-base leading-relaxed text-text-secondary">{t('craftP1')}</p>
            <p className="text-body-base leading-relaxed text-text-secondary">{t('craftP2')}</p>
          </div>
          <div className="relative aspect-square overflow-hidden bg-card-subtle md:order-2">
            <Image
              src={IMAGES.craft}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </article>
      </section>

      {/* Pillars */}
      <section className="bg-card-subtle px-6 py-24 md:px-8 md:py-32">
        <div className="mx-auto max-w-7xl">
          <span className="text-ui-label uppercase tracking-widest text-brand-accent">
            {t('pillarsTitle')}
          </span>

          <div className="mt-16 grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-12">
            {PILLARS.map((n) => (
              <div key={n} className="border-t border-text-primary pt-6">
                <span className="block font-cormorant text-7xl font-light leading-none text-brand-accent/70">
                  {t(`pillar${n}Num`)}
                </span>
                <h3 className="mt-6 font-cormorant text-2xl">{t(`pillar${n}Title`)}</h3>
                <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
                  {t(`pillar${n}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden px-6 py-32 text-center md:py-44">
        <Image src={IMAGES.cta} alt="" fill sizes="100vw" className="-z-10 object-cover" />
        <div className="absolute inset-0 -z-10 bg-brand-dark/55" />

        <div className="mx-auto max-w-xl space-y-6 text-text-inverse">
          <span className="text-ui-label uppercase tracking-widest opacity-80">{t('ctaTag')}</span>
          <h2 className="font-cormorant text-4xl font-light md:text-6xl">{t('ctaTitle')}</h2>
          <p className="text-body-base opacity-90">{t('ctaSubtitle')}</p>
          <div className="pt-4">
            <Link
              href="/catalogue"
              className="inline-flex items-center gap-3 border border-white/70 px-8 py-3.5 text-ui-button font-medium uppercase tracking-wider transition-colors hover:bg-white hover:text-text-primary"
            >
              <span>{t('ctaButton')}</span>
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
