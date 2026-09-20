import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { hasAdminPermission } from '@/lib/auth/decode-token';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_PREFIXES = ['/account', '/messages', '/notifications', '/wishlist', '/admin'];

function splitLocale(pathname: string): { locale: string; rest: string } {
  const [, maybeLocale, ...segments] = pathname.split('/');
  const candidate = maybeLocale?.toLowerCase();
  const isLocale = (routing.locales as readonly string[]).includes(candidate);

  return {
    locale: isLocale ? candidate : routing.defaultLocale,
    rest: isLocale ? `/${segments.join('/')}` : pathname,
  };
}

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  const { locale, rest } = splitLocale(request.nextUrl.pathname);

  if (!PROTECTED_PREFIXES.some((prefix) => rest.startsWith(prefix))) {
    return response;
  }

  const ACCESS_COOKIE_NAME = '__Host-access_token';
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);

    loginUrl.searchParams.set('returnTo', rest);

    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: UX-only gate. RolesGuard is what actually protects the
  // data — this just avoids rendering a page that will fail to load
  // anything, sending a logged-in-but-not-admin user back home instead.
  if (rest.startsWith('/admin') && !hasAdminPermission(accessToken)) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
