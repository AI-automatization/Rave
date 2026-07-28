import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, localeFromPath, stripLocale } from '@/lib/i18n/config';

// Routes that require authentication
const PROTECTED_PATHS = ['/home', '/room', '/profile', '/friends', '/messages'];

// Routes that should redirect to /home if already authenticated
const AUTH_PATHS = ['/login', '/register'];

/**
 * Auth guard only.
 *
 * Locale is decided by the URL and nothing else — no cookie, no IP, no
 * Accept-Language. A request for `/faq` gets the Russian page, `/uz/faq` gets the
 * Uzbek one, for every visitor, first-time or returning, human or crawler.
 *
 * The previous version redirected on a `wewatch-locale` cookie, which broke in
 * three ways that all matter more than the convenience it bought:
 *   1. A first-time visitor — the majority of traffic, and every new account —
 *      has no cookie, so the mechanism did nothing for exactly the people it was
 *      supposed to help. "Works only for people who already told us" is not
 *      language detection.
 *   2. A shared link stopped meaning one page. Someone with an `en` cookie who
 *      opened a Russian link was bounced to /en — a different page than the
 *      sender saw and linked to.
 *   3. The response for the same URL differed per visitor, so any shared cache
 *      in front of the app could hand one visitor's language to the next.
 * Language is now changed the one way that cannot misfire: the visitor clicks it
 * in LanguageSwitcher, which navigates to that language's URL.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = req.cookies.has('access_token') || req.cookies.has('refresh_token');

  // Strip the locale prefix before matching, so /uz/home is guarded exactly like
  // /home. Keep the prefix for redirects to stay in-locale.
  const pathLocale = localeFromPath(pathname);
  const localePrefix = pathLocale && pathLocale !== DEFAULT_LOCALE ? `/${pathLocale}` : '';
  const routePath = stripLocale(pathname);

  if (PROTECTED_PATHS.some((p) => routePath.startsWith(p)) && !isAuthenticated) {
    const loginUrl = new URL(`${localePrefix}/login`, req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_PATHS.some((p) => routePath.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL(`${localePrefix}/home`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * The app shell only — marketing pages need no proxy now that locale routing
   * is gone, and keeping them out means they are served straight from the cache.
   * Locale prefixes are listed explicitly because the guard has to see /uz/home
   * as well as /home.
   */
  matcher: [
    '/home/:path*',
    '/room/:path*',
    '/profile/:path*',
    '/friends/:path*',
    '/messages/:path*',
    '/login',
    '/register',
    '/:locale(uz|en)/home/:path*',
    '/:locale(uz|en)/room/:path*',
    '/:locale(uz|en)/profile/:path*',
    '/:locale(uz|en)/friends/:path*',
    '/:locale(uz|en)/messages/:path*',
    '/:locale(uz|en)/login',
    '/:locale(uz|en)/register',
  ],
};
