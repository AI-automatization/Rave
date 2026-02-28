import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/', '/login', '/register', '/features', '/pricing'];
const AUTH_PATHS   = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value;

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));

  // Login/register sahifasiga kirgan autentifikatsiya bo'lgan foydalanuvchini home ga yuborish
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // Himoyalangan sahifaga kirgan autentifikatsiya bo'lmagan foydalanuvchini login ga yuborish
  if (!token && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots.txt|icons).*)',
  ],
};
