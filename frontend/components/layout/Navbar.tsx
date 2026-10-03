'use client';

import { useState } from 'react';
import { Search, Heart, ShoppingBag, Menu, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { CartDot } from '@/components/ui/feedback/cart-dot';
import { WishlistDot } from '@/components/ui/feedback/wishlist-dot';
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
    <nav className="relative flex h-16 w-full items-center justify-between px-6 md:px-8">
      {/* Left Section: Logo */}
      <Link href="/" className="font-serif text-lg tracking-widest text-text-primary">
        Aura
      </Link>

      {/* Center Section: Desktop Navigation */}
      <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center gap-8">
        {[
          { href: '/catalogue', label: t('shop') },
          { href: '/community', label: t('community') },
          { href: '/about', label: t('about') },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative py-1 text-sm tracking-wider text-text-secondary hover:text-text-primary transition-colors"
          >
            {item.label}
            <span className="absolute bottom-0 left-0 h-[1.5px] w-full origin-bottom-right scale-x-0 bg-brand-accent transition-transform duration-300 ease-out group-hover:origin-bottom-left group-hover:scale-x-100" />
          </Link>
        ))}
      </div>

      {/* Right Section: Actions & Language */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          type="button"
          aria-label={t('search')}
          aria-haspopup="dialog"
          onClick={() => setSearchOpen(true)}
          className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors flex h-5 w-5 items-center justify-center"
        >
          <Search className="h-5 w-5" />
        </button>
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Wishlist */}
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Link
            href="/wishlist"
            aria-label={t('wishlist')}
            className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors flex h-5 w-5 items-center justify-center"
          >
            <Heart className="h-5 w-5" />
            <WishlistDot />
          </Link>
        </div>

        {/* Cart Trigger */}
        <div className="relative flex h-5 w-5 items-center justify-center">
          <Link
            href="/checkout"
            aria-label={t('cart')}
            className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors flex h-5 w-5 items-center justify-center"
          >
            <ShoppingBag className="h-5 w-5" />
            <CartDot />
          </Link>
        </div>

        {/* Desktop Language Switcher */}
        <div className="hidden sm:flex items-center border-l border-border-default pl-3 text-xs tracking-wider uppercase">
          {routing.locales.map((lang, index) => (
            <div key={lang} className="flex items-center">
              <button
                type="button"
                onClick={() => router.replace(pathname, { locale: lang })}
                className={`cursor-pointer px-1 transition-colors ${
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
        <div className="flex h-5 w-5 items-center justify-center">
          <NotificationBell />
        </div>

        {/* User Menu */}
        <div className="relative flex items-center justify-center">
          <UserMenu />
          <RealtimeStatusDot />
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-text-secondary hover:text-text-primary cursor-pointer transition-colors md:hidden flex h-5 w-5 items-center justify-center"
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
            href="/community"
            onClick={() => setMenuOpen(false)}
            className="text-text-secondary hover:text-text-primary uppercase tracking-wider text-xs transition-colors"
          >
            {t('community')}
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
            <span className="text-xs text-text-muted mr-2">{t('language')}</span>
            {routing.locales.map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  router.replace(pathname, { locale: lang });
                }}
                className={`text-xs px-2 py-1 rounded border transition-colors uppercase cursor-pointer ${
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
