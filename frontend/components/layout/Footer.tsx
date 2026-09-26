'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

interface FooterLinkItem {
  label: string;
  href: string;
}

function FooterColumn({ label, links }: { label: string; links: FooterLinkItem[] }) {
  return (
    <div>
      <span className="text-ui-label text-footer-subtle mb-4 block uppercase tracking-widest">
        {label}
      </span>
      {links.map((link) => (
        <Link
          key={link.href + link.label}
          href={link.href}
          className="text-ui-nav text-footer-text mb-2 block cursor-pointer hover:text-footer-muted transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname();

  /* Hide Footer on auth routes and inside admin shell */
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin');
  if (isAuthPage) return null;

  const shopLinks: FooterLinkItem[] = [
    { label: t('shopSerums'), href: '/catalogue' },
    { label: t('shopFaceCare'), href: '/catalogue' },
    { label: t('shopRitualSets'), href: '/catalogue' },
  ];

  const legalLinks: FooterLinkItem[] = [
    { label: t('termsOfService'), href: '/legal/terms-of-service' },
    { label: t('termsOfSale'), href: '/legal/terms-of-sale' },
    { label: t('privacyPolicy'), href: '/legal/privacy-policy' },
  ];

  const aboutLinks: FooterLinkItem[] = [
    { label: t('aboutStory'), href: '/about' },
    { label: t('community'), href: '/community' },
  ];

  return (
    <footer className="bg-footer-bg px-6 md:px-8 pt-12 pb-6">
      <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        {/* Brand identity column */}
        <div className="col-span-2 md:col-span-1">
          <p className="font-cormorant text-footer-text mb-2 text-body-lg tracking-widest">Aura</p>
          <p className="text-body-sm text-footer-muted max-w-xs">{t('tagline')}</p>
        </div>

        {/* Navigation columns */}
        <FooterColumn label={t('shop')} links={shopLinks} />
        <FooterColumn label={t('legal')} links={legalLinks} />
        <FooterColumn label={t('about')} links={aboutLinks} />
      </div>

      <div className="border-footer-subtle border-t pt-6">
        <span className="text-ui-lang text-footer-subtle">{t('copyright')}</span>
      </div>
    </footer>
  );
}
