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

  // TODO: backend tayyor bo'lganda qaytarish
  // Protected routes: redirect to /login if not authenticated
  // if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
  //   if (!isAuthenticated) {
  //     const loginUrl = new URL('/login', req.url);
  //     loginUrl.searchParams.set('redirect', pathname);
  //     return NextResponse.redirect(loginUrl);
  //   }
  // }

  // Auth routes: redirect to /home if already authenticated
  if (AUTH_PATHS.some((p) => pathname.startsWith(p))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/room/:path*', '/profile/:path*', '/friends/:path*', '/messages/:path*', '/login', '/register/:path*'],
};
