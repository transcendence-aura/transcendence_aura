'use client';

import { useState } from 'react';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

const NAV_LINKS = ['Shop', 'Ritual', 'Journal', 'About'];
const LOCALES = ['FR', 'EN', 'AR'] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('FR');

  return (
    <nav className="bg-card border-default flex h-13.5 items-center justify-between border-b px-8">
      {/* Logo */}
      <span className="font-display text-text-primary text-[20px] tracking-[0.04em]">Aura</span>

      {/* Desktop links */}
      <ul className="hidden gap-7 md:flex">
        {NAV_LINKS.map((link) => (
          <li key={link} className="text-ui-nav text-text-secondary cursor-pointer uppercase">
            {link}
          </li>
        ))}
      </ul>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <Search className="text-text-secondary h-4 w-4 cursor-pointer" aria-label="Search" />

        <div className="relative cursor-pointer">
          <ShoppingBag className="text-text-secondary h-4 w-4" aria-label="Cart" />
          <span className="bg-brand-accent text-ui-badge text-text-primary absolute -top-1 -right-1 flex h-3.25 w-3.25 items-center justify-center rounded-full">
            2
          </span>
        </div>

        <div className="bg-brand-dark text-text-inverse flex h-6.5 w-6.5 items-center justify-center rounded-full text-[9px] leading-none tracking-normal">
          ML
        </div>

        {/* Language selector */}
        <div className="border-default flex items-center border-l pl-3.5 rtl:border-l-0 rtl:border-r rtl:pr-3.5 rtl:pl-0">
          {LOCALES.map((code, i) => (
            <span key={code} className="contents">
              <span
                role="button"
                tabIndex={0}
                onClick={() => setLocale(code)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLocale(code)}
                className={`text-ui-lang cursor-pointer px-1.5 uppercase ${
                  locale === code ? 'text-text-primary' : 'text-text-muted'
                }`}
              >
                {code}
              </span>
              {i < LOCALES.length - 1 && (
                <span className="text-ui-lang text-border-default">·</span>
              )}
            </span>
          ))}
        </div>

        {/* Mobile toggle */}
        <button
          className="text-text-secondary md:hidden"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="bg-card border-default absolute inset-x-0 top-13.5 flex flex-col gap-4 border-b p-8 md:hidden">
          {NAV_LINKS.map((link) => (
            <span
              key={link}
              role="button"
              tabIndex={0}
              onClick={() => setMenuOpen(false)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMenuOpen(false)}
              className="text-ui-nav text-text-secondary cursor-pointer uppercase"
            >
              {link}
            </span>
          ))}
        </div>
      )}
    </nav>
  );
}
