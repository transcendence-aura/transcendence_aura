import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPermission } from '@/lib/auth/decode-token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ACCESS_COOKIE_NAME = '__Host-access_token';

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);

    loginUrl.searchParams.set('returnTo', pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: UX-only gate. RolesGuard is what actually protects the
  // data — this just avoids rendering a page that will fail to load
  // anything, sending a logged-in-but-not-admin user back home instead.
  if (pathname.startsWith('/admin') && !hasAdminPermission(accessToken)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/wishlist/:path*',
    '/admin/:path*',
  ],
};
