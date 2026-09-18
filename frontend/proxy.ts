import { NextRequest, NextResponse } from 'next/server';
import { hasAdminPermission } from '@/lib/auth/decode-token';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check both secure Host prefix and standard dev cookie names
  const accessToken =
    request.cookies.get('__Host-access_token')?.value || request.cookies.get('access_token')?.value;

  // In local dev without SSR cookies, allow navigation; client-side guards & Apollo handle protection
  if (!accessToken && process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes: UX-only gate.
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
