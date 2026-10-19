'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@apollo/client/react';
import { Link, usePathname } from '@/i18n/navigation';
import { GET_COLLECTIONS } from '@/lib/graphql/queries/collections';

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
  const tFilters = useTranslations('CatalogueFilters');
  const pathname = usePathname();
  // Same query as the home page collections section: served from the Apollo cache.
  const { data } = useQuery(GET_COLLECTIONS);

  /* Hide Footer on auth routes and inside admin shell */
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin');
  if (isAuthPage) return null;

  const shopLinks: FooterLinkItem[] = [
    ...(data?.collections ?? []).map((collection) => ({
      label: tFilters.has(`collections.${collection.slug}`)
        ? tFilters(`collections.${collection.slug}`)
        : collection.name,
      href: `/catalogue?collection=${collection.slug}`,
    })),
    // Serums & Oils is a category, not a collection: same static entry as the home page.
    { label: tFilters('categories.serums-and-oils'), href: '/catalogue?category=serums-and-oils' },
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
