import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { hasAdminPermission } from '@/lib/auth/decode-token';
import { routing } from '@/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const PROTECTED_SEGMENTS = [
  'account',
  'chat',
  'messages',
  'notifications',
  'settings',
  'wishlist',
  'admin',
];

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function splitLocale(pathname: string): { locale: string; segments: string[] } {
  const decoded = pathname.split('/').map(decodeSegment).join('/');
  const segments = new URL(`http://localhost${decoded}`).pathname.split('/').filter(Boolean);
  const candidate = segments[0]?.toLowerCase();
  const isLocale = (routing.locales as readonly string[]).includes(candidate);

  return {
    locale: isLocale ? candidate : routing.defaultLocale,
    segments: isLocale ? segments.slice(1) : segments,
  };
}

export function proxy(request: NextRequest) {
  const response = handleI18nRouting(request);

  const { locale, segments } = splitLocale(request.nextUrl.pathname);
  const section = segments[0];

  if (!section || !PROTECTED_SEGMENTS.includes(section)) {
    return response;
  }

  const ACCESS_COOKIE_NAME = '__Host-access_token';
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    const loginUrl = new URL(`/${locale}/login`, request.url);

    loginUrl.searchParams.set('returnTo', `/${segments.join('/')}`);

    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: UX-only gate. RolesGuard is what actually protects the
  // data — this just avoids rendering a page that will fail to load
  // anything, sending a logged-in-but-not-admin user back home instead.
  if (section === 'admin' && !hasAdminPermission(accessToken)) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
