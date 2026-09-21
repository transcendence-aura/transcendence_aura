'use client';

import { useTranslations } from 'next-intl';
import { usePathname } from '@/i18n/navigation';

const SHOP = ['shopSerums', 'shopFaceCare', 'shopRitualSets'] as const;
const SUPPORT = ['supportFaq', 'supportShipping', 'supportContact'] as const;
const ABOUT = ['aboutStory', 'aboutSustainability', 'aboutJournal'] as const;

const SOCIALS = ['Instagram', 'Pinterest', 'TikTok'];

function FooterColumn({ label, links }: { label: string; links: string[] }) {
  return (
    <div>
      <span className="text-ui-label text-footer-subtle mb-4 block uppercase tracking-widest">
        {label}
      </span>
      {links.map((link) => (
        <a
          key={link}
          className="text-ui-nav text-footer-text mb-2 block cursor-pointer hover:text-footer-muted transition-colors"
        >
          {link}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  const t = useTranslations('Footer');
  const pathname = usePathname();

  /* Hide Footer on auth routes and inside the admin shell to respect minimal layout - NEW */
  const isAuthPage =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/chat' ||
    pathname.startsWith('/admin');
  if (isAuthPage) return null;

  return (
    <footer className="bg-footer-bg px-6 md:px-8 pt-12 pb-6">
      <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <p className="font-cormorant text-footer-text mb-2 text-lg tracking-widest">Aura</p>
          <p className="text-body-sm text-footer-muted max-w-xs">{t('tagline')}</p>
        </div>

        <FooterColumn label={t('shop')} links={SHOP.map((key) => t(key))} />
        <FooterColumn label={t('support')} links={SUPPORT.map((key) => t(key))} />
        <FooterColumn label={t('about')} links={ABOUT.map((key) => t(key))} />
      </div>

      <div className="border-footer-subtle flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <span className="text-ui-lang text-footer-subtle">{t('copyright')}</span>
        <div className="flex gap-6">
          {SOCIALS.map((s) => (
            <span
              key={s}
              className="text-ui-lang text-footer-subtle cursor-pointer hover:text-footer-text transition-colors"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
