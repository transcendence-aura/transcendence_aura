'use client';

import { useState } from 'react';
import { Search, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { CartDot } from '@/components/ui/feedback/cart-dot';
import { UserMenu, UserMenuMobile } from '@/components/layout/UserMenu';

const LANGUAGES = ['EN', 'FR', 'AR'] as const;
type Language = (typeof LANGUAGES)[number];

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState<Language>('EN');
  const pathname = usePathname();

  /* Hide Navbar on auth routes and inside the admin shell (its own layout provides navigation) */
  const isAuthPage =
    pathname === '/login' || pathname === '/register' || pathname.startsWith('/admin');
  if (isAuthPage) return null;

  return (
    <nav className="bg-card border-border-default flex h-16 items-center justify-between border-b px-6 md:px-8">
      {/* Left Section: Logo */}
      <Link href="/" className="font-cormorant text-text-primary text-lg tracking-widest">
        Aura
      </Link>

      {/* Center Section: Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/catalogue"
          className="text-text-secondary hover:text-text-primary text-xs uppercase tracking-wider transition-colors"
        >
          Shop
        </Link>
        <Link
          href="/journal"
          className="text-text-secondary hover:text-text-primary text-xs uppercase tracking-wider transition-colors"
        >
          Journal
        </Link>
        <Link
          href="/about"
          className="text-text-secondary hover:text-text-primary text-xs uppercase tracking-wider transition-colors"
        >
          About
        </Link>
      </div>

      {/* Right Section: Actions & Language */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          aria-label="Search"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Wishlist */}
        <Link
          href="/wishlist"
          aria-label="Wishlist"
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <Heart className="h-5 w-5" />
        </Link>

        {/* Cart Trigger */}
        <div className="relative">
          <Link
            href="/checkout"
            aria-label="Shopping cart"
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center"
          >
            <ShoppingBag className="h-5 w-5" />
            <CartDot />
          </Link>
        </div>

        {/* Desktop Language Switcher */}
        <div className="hidden sm:flex items-center border-l border-border-default pl-3 text-[10px] tracking-wider uppercase">
          {LANGUAGES.map((lang, index) => (
            <div key={lang} className="flex items-center">
              <button
                type="button"
                onClick={() => setCurrentLang(lang)}
                className={`px-1 transition-colors ${
                  currentLang === lang
                    ? 'font-medium text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                aria-label={`Select ${lang} language`}
              >
                {lang}
              </button>
              {index < LANGUAGES.length - 1 && (
                <span className="text-border-default select-none">|</span>
              )}
            </div>
          ))}
        </div>

        {/* User Menu */}
        <UserMenu />

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-text-secondary hover:text-text-primary transition-colors md:hidden"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="bg-card border-border-default absolute inset-x-0 top-16 z-50 flex flex-col gap-4 border-b p-6 md:hidden shadow-sm">
          <Link
            href="/catalogue"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors"
          >
            Shop
          </Link>
          <Link
            href="/journal"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors"
          >
            Journal
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors"
          >
            About
          </Link>

          {/* Cart Mobile */}
          <Link
            href="/checkout"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" /> Cart
          </Link>

          {/* Mobile Language Selection */}
          <div className="flex items-center gap-2 border-t border-border-default pt-4">
            <span className="text-[10px] uppercase tracking-wider text-text-muted mr-2">
              Language:
            </span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setCurrentLang(lang)}
                className={`text-xs px-2 py-1 rounded border transition-colors ${
                  currentLang === lang
                    ? 'border-brand-dark bg-brand-dark text-white font-medium'
                    : 'border-border-default text-text-secondary'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          {/* Account menu */}
          <UserMenuMobile onNavigate={() => setMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
}
