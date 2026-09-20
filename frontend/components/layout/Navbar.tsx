'use client';

import { useState } from 'react';
import { Search, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { CartDot } from '@/components/ui/feedback/cart-dot';
import { RealtimeStatusDot } from '@/components/ui/feedback/realtime-status-dot';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { UserMenu, UserMenuMobile } from '@/components/layout/UserMenu';
import { SearchOverlay } from '@/components/search/SearchOverlay';

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  /* Hide Navbar on auth routes and inside theadmin shell (its own layout provides navigation) */
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
          {t('shop')}
        </Link>
        <Link
          href="/journal"
          className="text-text-secondary hover:text-text-primary text-xs uppercase tracking-wider transition-colors"
        >
          {t('journal')}
        </Link>
        <Link
          href="/about"
          className="text-text-secondary hover:text-text-primary text-xs uppercase tracking-wider transition-colors"
        >
          {t('about')}
        </Link>
      </div>

      {/* Right Section: Actions & Language */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          type="button"
          aria-label={t('search')}
          aria-haspopup="dialog"
          onClick={() => setSearchOpen(true)}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Wishlist */}
        <Link
          href="/wishlist"
          aria-label={t('wishlist')}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <Heart className="h-5 w-5" />
        </Link>

        {/* Cart Trigger */}
        <div className="relative">
          <Link
            href="/checkout"
            aria-label={t('cart')}
            className="text-text-secondary hover:text-text-primary transition-colors flex items-center"
          >
            <ShoppingBag className="h-5 w-5" />
            <CartDot />
          </Link>
        </div>

        {/* Desktop Language Switcher */}
        <div className="hidden sm:flex items-center border-l border-border-default pl-3 text-[10px] tracking-wider uppercase">
          {routing.locales.map((lang, index) => (
            <div key={lang} className="flex items-center">
              <button
                type="button"
                onClick={() => router.replace(pathname, { locale: lang })}
                className={`px-1 transition-colors ${
                  locale === lang
                    ? 'font-medium text-text-primary'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                aria-label={`Select ${lang} language`}
              >
                {lang}
              </button>
              {index < routing.locales.length - 1 && (
                <span className="text-border-default select-none">|</span>
              )}
            </div>
          ))}
        </div>

        {/* Notifications */}
        <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <UserMenu />
          <RealtimeStatusDot />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-text-secondary hover:text-text-primary transition-colors md:hidden"
          aria-label={t('toggleMenu')}
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
            {t('shop')}
          </Link>
          <Link
            href="/journal"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors"
          >
            {t('journal')}
          </Link>
          <Link
            href="/about"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors"
          >
            {t('about')}
          </Link>

          {/* Cart Mobile */}
          <Link
            href="/checkout"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors flex items-center gap-2"
          >
            <ShoppingBag className="h-4 w-4" /> {t('cartMobile')}
          </Link>

          {/* Mobile Language Selection */}
          <div className="flex items-center gap-2 border-t border-border-default pt-4">
            <span className="text-[10px] uppercase tracking-wider text-text-muted mr-2">
              {t('language')}
            </span>
            {routing.locales.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.replace(pathname, { locale: lang });
                }}
                className={`text-xs px-2 py-1 rounded border transition-colors uppercase ${
                  locale === lang
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
