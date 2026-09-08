import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ACCESS_COOKIE_NAME = '__Host-access_token';

  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!accessToken) {
    const loginUrl = new URL('/login', request.url);

    loginUrl.searchParams.set(
      'returnTo',
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/account/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/wishlist/:path*',
  ],
};
