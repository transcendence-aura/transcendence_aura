'use client';

import { useState } from 'react';
import { Search, ShoppingBag, Menu, X } from 'lucide-react';

const NAV_LINKS = ['Shop', 'Ritual', 'Journal', 'About'];
const LOCALES = ['FR', 'EN', 'AR'] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('FR');

  return (
    <nav className="bg-card border-border-default flex h-16 items-center justify-between border-b px-6 md:px-8">
      <span className="font-cormorant text-text-primary text-lg tracking-widest">Aura</span>

      <ul className="hidden gap-8 md:flex">
        {NAV_LINKS.map((link) => (
          <li
            key={link}
            className="text-ui-nav text-text-secondary cursor-pointer uppercase hover:text-text-primary transition-colors"
          >
            {link}
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4">
        <Search
          className="text-text-secondary h-4 w-4 cursor-pointer hover:text-text-primary transition-colors"
          aria-label="Search"
        />

        <div className="relative cursor-pointer">
          <ShoppingBag
            className="text-text-secondary h-4 w-4 hover:text-text-primary transition-colors"
            aria-label="Cart"
          />
          <span className="bg-brand-accent text-ui-badge text-text-inverse absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full text-xs font-semibold">
            2
          </span>
        </div>

        <div className="bg-brand-dark text-text-inverse flex h-7 w-7 items-center justify-center rounded-full text-ui-label font-medium">
          ML
        </div>

        <div className="border-border-default flex items-center border-l pl-4 rtl:border-l-0 rtl:border-r rtl:pr-4 rtl:pl-0">
          {LOCALES.map((code, i) => (
            <span key={code} className="contents">
              <span
                role="button"
                tabIndex={0}
                onClick={() => setLocale(code)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLocale(code)}
                className={`text-ui-lang cursor-pointer px-2 uppercase transition-colors ${
                  locale === code ? 'text-text-primary' : 'text-text-muted hover:text-text-primary'
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

        <button
          className="text-text-secondary md:hidden hover:text-text-primary transition-colors"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="bg-card border-border-default absolute inset-x-0 top-16 flex flex-col gap-4 border-b p-6 md:hidden">
          {NAV_LINKS.map((link) => (
            <span
              key={link}
              role="button"
              tabIndex={0}
              onClick={() => setMenuOpen(false)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setMenuOpen(false)}
              className="text-ui-nav text-text-secondary cursor-pointer uppercase hover:text-text-primary transition-colors"
            >
              {link}
            </span>
          ))}
        </div>
      )}
    </nav>
  );
}
