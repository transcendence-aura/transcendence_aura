'use client';

import { usePathname } from 'next/navigation';

const SHOP = ['Serums & Oils', 'Face Care', 'Ritual Sets'];
const SUPPORT = ['FAQ', 'Shipping & Returns', 'Contact'];
const ABOUT = ['Our Story', 'Sustainability', 'Journal'];
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
  const pathname = usePathname();

  /* Hide Footer on auth routes to respect minimal layout - NEW */
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage) return null;

  return (
    <footer className="bg-footer-bg px-6 md:px-8 pt-12 pb-6">
      <div className="mb-8 grid grid-cols-2 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="col-span-2 md:col-span-1">
          <p className="font-cormorant text-footer-text mb-2 text-lg tracking-widest">Aura</p>
          <p className="text-body-sm text-footer-muted max-w-xs">
            Pure botanical formulations for mindful skin rituals.
          </p>
        </div>

        <FooterColumn label="Shop" links={SHOP} />
        <FooterColumn label="Support" links={SUPPORT} />
        <FooterColumn label="About" links={ABOUT} />
      </div>

      <div className="border-footer-subtle flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <span className="text-ui-lang text-footer-subtle">© 2026 Aura. All rights reserved.</span>
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
