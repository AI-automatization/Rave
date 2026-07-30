import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, localeFromPath, stripLocale } from '@/lib/i18n/config';
import { localeForRoot } from '@/lib/i18n/detect';

// Routes that require authentication
const PROTECTED_PATHS = ['/home', '/room', '/profile', '/friends', '/messages'];

// Routes that should redirect to /home if already authenticated
const AUTH_PATHS = ['/login', '/register'];

/**
 * Auth guard, plus the language pick at `/`.
 *
 * Every page URL carries its own locale and is served exactly as addressed:
 * `/ru/faq` is Russian, `/uz/faq` is Uzbek, for every visitor, first-time or
 * returning, human or crawler. Nothing is stored — no cookie, no localStorage,
 * no IP lookup — so the same URL always means the same page.
 *
 * `/` is the one exception, because it names no language and has to send the
 * visitor somewhere. It reads `Accept-Language` (see `lib/i18n/detect.ts` for
 * why that and not IP) and redirects, temporarily and without remembering the
 * outcome. Being confined to `/` is what makes it safe: the earlier
 * cookie-driven version redirected everywhere, so a shared Russian link opened
 * a different page for a visitor whose cookie said otherwise, and a first-time
 * visitor — having no cookie — got nothing out of the mechanism at all.
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAuthenticated = req.cookies.has('access_token') || req.cookies.has('refresh_token');

  if (pathname === '/') {
    const locale = localeForRoot(
      req.headers.get('accept-language'),
      req.headers.get('user-agent'),
    );
    const res = NextResponse.redirect(new URL(`/${locale}`, req.url), 307);
    // 307, never 301: a permanent redirect is cached by the browser forever, and
    // the visitor who happened to arrive with a German browser would be pinned to
    // /en on every later visit, from any device state, with no way to undo it.
    //
    // The response differs per visitor, so it must not be shared. `no-store`
    // keeps it out of the Railway edge and any intermediary; `Vary` states the
    // dependency for caches that store it anyway. This costs nothing elsewhere —
    // it is one redirect, and every actual page stays fully cacheable.
    res.headers.set('Cache-Control', 'no-store');
    res.headers.set('Vary', 'Accept-Language, User-Agent');
    return res;
  }

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
   * The app shell, plus the bare `/`. Marketing pages are deliberately absent:
   * they need no proxy, and staying out of it means they are served straight
   * from the cache. Locale prefixes are listed explicitly because the guard has
   * to see /uz/home as well as /home.
   */
  matcher: [
    '/',
    '/home/:path*',
    '/room/:path*',
    '/profile/:path*',
    '/friends/:path*',
    '/messages/:path*',
    '/login',
    '/register',
    '/:locale(ru|uz|en)/home/:path*',
    '/:locale(ru|uz|en)/room/:path*',
    '/:locale(ru|uz|en)/profile/:path*',
    '/:locale(ru|uz|en)/friends/:path*',
    '/:locale(ru|uz|en)/messages/:path*',
    '/:locale(ru|uz|en)/login',
    '/:locale(ru|uz|en)/register',
  ],
};
