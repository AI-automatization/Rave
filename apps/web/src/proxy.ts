import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PATHS = ['/home', '/room', '/profile', '/friends', '/messages'];

// Routes that should redirect to /home if already authenticated
const AUTH_PATHS = ['/login', '/register'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasAccessToken = req.cookies.has('access_token');
  const hasRefreshToken = req.cookies.has('refresh_token');
  const isAuthenticated = hasAccessToken || hasRefreshToken;

  // Strip the /uz locale prefix before matching, so /uz/home is guarded
  // exactly like /home. Keep the prefix for redirects to stay in-locale.
  const hasUzPrefix = pathname === '/uz' || pathname.startsWith('/uz/');
  const localePrefix = hasUzPrefix ? '/uz' : '';
  const routePath = hasUzPrefix ? pathname.slice(localePrefix.length) || '/' : pathname;

  // Protected routes: redirect to /login if not authenticated
  if (PROTECTED_PATHS.some((p) => routePath.startsWith(p))) {
    if (!isAuthenticated) {
      const loginUrl = new URL(`${localePrefix}/login`, req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Auth routes: redirect to /home if already authenticated
  if (AUTH_PATHS.some((p) => routePath.startsWith(p))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL(`${localePrefix}/home`, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/room/:path*', '/profile/:path*', '/friends/:path*', '/messages/:path*', '/login', '/register/:path*', '/uz/:path*', '/en/:path*'],
};
