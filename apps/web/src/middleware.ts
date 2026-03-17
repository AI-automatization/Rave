import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/features', '/pricing'];
const AUTH_PATHS   = ['/login', '/register'];

/** Decode JWT payload without verification (Edge Runtime compatible) */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload)) as { exp?: number };
    if (!decoded.exp) return true;
    // 30s buffer to avoid edge-case race
    return decoded.exp * 1000 < Date.now() - 30_000;
  } catch {
    return true;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;
  const hasValidToken = !!token && !isTokenExpired(token);

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Login/register sahifasiga kirgan autentifikatsiya bo'lgan foydalanuvchini home ga yuborish
  if (hasValidToken && isAuthPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Himoyalangan sahifaga kirgan autentifikatsiya bo'lmagan foydalanuvchini login ga yuborish
  if (!hasValidToken && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|auth|users|movies|watch-party|battles|notifications|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|icons).*)',
  ],
};
