'use client';

import { useState } from 'react';
import { Search, ShoppingBag, Heart, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { CartDot } from '@/components/ui/feedback/cart-dot';

const NAV_LINKS = [
  { label: 'Shop', href: '/catalogue' },
  { label: 'Ritual', href: '#' },
  { label: 'Journal', href: '#' },
  { label: 'About', href: '#' },
];
const LOCALES = ['FR', 'EN', 'AR'] as const;

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [locale, setLocale] = useState<(typeof LOCALES)[number]>('FR');

  return (
    <nav className="bg-card border-border-default flex h-16 items-center justify-between border-b px-6 md:px-8">
      <Link href="/" className="font-cormorant text-text-primary text-lg tracking-widest">
        Aura
      </Link>

      <ul className="hidden gap-8 md:flex">
        {NAV_LINKS.map((link, index) => (
          <li key={index}>
            <Link
              href={link.href}
              className="text-ui-nav text-text-secondary hover:text-text-primary cursor-pointer uppercase transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-4">
        <Search
          className="text-text-secondary hover:text-text-primary h-4 w-4 cursor-pointer transition-colors"
          aria-label="Search"
        />

        <Link
          href="/wishlist"
          aria-label="Wishlist"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <Heart className="h-4 w-4" />
        </Link>

        <div className="relative cursor-pointer">
          <Link href="/cart" aria-label="Shopping cart" className="flex items-center">
            <ShoppingBag className="text-text-secondary hover:text-text-primary h-4 w-4 transition-colors" />
            <CartDot />
          </Link>
        </div>

        <div className="bg-brand-dark text-text-inverse text-ui-label flex h-7 w-7 items-center justify-center rounded-full font-medium">
          ML
        </div>

        <div className="border-border-default flex items-center border-l pl-4 rtl:border-r rtl:border-l-0 rtl:pr-4 rtl:pl-0">
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
          className="text-text-secondary hover:text-text-primary md:hidden transition-colors"
          aria-label="Menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="bg-card border-border-default absolute inset-x-0 top-16 flex flex-col gap-4 border-b p-6 md:hidden">
          {NAV_LINKS.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-ui-nav text-text-secondary hover:text-text-primary cursor-pointer uppercase transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/wishlist"
            onClick={() => setMenuOpen(false)}
            className="text-ui-nav text-text-secondary hover:text-text-primary cursor-pointer uppercase transition-colors"
          >
            Wishlist
          </Link>
        </div>
      )}
    </nav>
  );
}
