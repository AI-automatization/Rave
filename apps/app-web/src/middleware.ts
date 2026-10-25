import { NextRequest, NextResponse } from 'next/server';

// Routes that require authentication
const PROTECTED_PATHS = ['/home', '/room', '/profile', '/friends', '/messages'];

// Routes that should redirect to /home if already authenticated
const AUTH_PATHS = ['/login', '/register'];

export function middleware(req: NextRequest) {
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
      // Any room link → guest join with just a name, no registration. Used to require ?code=, so a
      // link copied from the address bar (/room/<id>, no code) sent the friend to /login instead
      // (2026-10-25: "link orqali kino ko'rishga kirgan odamdan registratsiya so'ramasin").
      // Private rooms still need their code/password — the server checks that on join.
      if (routePath.startsWith('/room/')) {
        const guestUrl = new URL('/guest', req.url);
        guestUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
        return NextResponse.redirect(guestUrl);
      }
      const loginUrl = new URL(`${localePrefix}/login`, req.url);
      // Room share links carry ?code=INVITECODE — pathname alone drops the query
      // string, which silently lost the invite code on the login round-trip.
      loginUrl.searchParams.set('redirect', pathname + req.nextUrl.search);
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
