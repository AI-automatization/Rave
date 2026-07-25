import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isLocale,
  localeFromPath,
  stripLocale,
} from '@/lib/i18n/config';
import { translatedPath } from '@/lib/i18n/routes';

// Routes that require authentication
const PROTECTED_PATHS = ['/home', '/room', '/profile', '/friends', '/messages'];

// Routes that should redirect to /home if already authenticated
const AUTH_PATHS = ['/login', '/register'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const authResponse = guardAuth(req, pathname);
  if (authResponse) return authResponse;

  return routeLocale(req, pathname);
}

/**
 * Auth guard. Runs before locale routing: being sent to the login page matters
 * more than being sent to a translation of a page you cannot see anyway.
 */
function guardAuth(req: NextRequest, pathname: string): NextResponse | null {
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

  return null;
}

/**
 * Locale routing.
 *
 * Deliberately narrow: the only thing that redirects is a *returning* visitor
 * who has already chosen a language. Everything else is served as requested.
 *
 * Why no Accept-Language redirect:
 *   Googlebot crawls from US IPs and either omits Accept-Language or sends `en`.
 *   Redirecting on that header would bounce every crawl of the Russian root to
 *   /en, and the Russian and Uzbek pages would silently fall out of the index.
 *   Accept-Language is instead used to *suggest* a language via a dismissible
 *   banner (LocaleSuggestBanner) — the Wikipedia/GitHub model, where a wrong
 *   guess costs one click instead of trapping the visitor in the wrong language.
 *
 * Why not IP/geo at all:
 *   IP tells you a country, not a language — a large share of Tashkent traffic
 *   reads Russian, and a VPN or a crawler makes it meaningless. It also carries
 *   the same Googlebot problem, but without a header the user can control.
 *
 * 307, never 308/301: the target depends on a cookie the user can change, so the
 * browser must never cache the redirect as permanent.
 */
function routeLocale(req: NextRequest, pathname: string): NextResponse {
  const pathLocale = localeFromPath(pathname);

  // A prefixed URL (/uz, /en) is an explicit request for that language — from a
  // shared link, a search result or an hreflang tag. Never second-guess it.
  if (pathLocale !== null && pathLocale !== DEFAULT_LOCALE) return withVary(NextResponse.next());

  const cookieValue = req.cookies.get(LOCALE_COOKIE)?.value;
  const preferred = isLocale(cookieValue) ? cookieValue : null;

  // No stored choice (first visit — or a crawler, which sends no cookies): serve
  // the page as-is. The banner makes the suggestion client-side, so the response
  // stays identical for every visitor and remains CDN-cacheable.
  if (!preferred || preferred === DEFAULT_LOCALE) return withVary(NextResponse.next());

  // Returning visitor who reads Uzbek or English. Only redirect when this exact
  // page exists in their language — otherwise leave them on the Russian page
  // rather than dumping them on an unrelated home page mid-navigation.
  const target = translatedPath(pathname, preferred);
  if (!target || target === pathname) return withVary(NextResponse.next());

  const url = req.nextUrl.clone();
  url.pathname = target;

  const response = NextResponse.redirect(url, 307);
  // Cookie-dependent — must never be stored by a shared cache and handed to the
  // next visitor.
  response.headers.set('Cache-Control', 'no-store');
  return withVary(response);
}

/**
 * Tells caches the response varies by language negotiation.
 *
 * `Vary: Cookie` is intentionally *not* sent: it would key the cache on the full
 * cookie header (analytics cookies included), collapsing the hit rate on the
 * marketing pages. The trade-off is that a CDN in front of the app can serve a
 * cached Russian page to a visitor whose cookie says Uzbek, since this proxy
 * never runs on a cache hit. If a CDN is put in front of wewatch.uz, drop `/`,
 * `/uz` and `/en` from the cacheable list in next.config.mjs.
 */
function withVary(response: NextResponse) {
  response.headers.set('Vary', 'Accept-Language');
  return response;
}

export const config = {
  /*
   * Everything except:
   *   api/*    — JSON endpoints, never localized by URL
   *   _next/*  — build output and image optimizer
   *   og-image — dynamic OG renderer
   *   *.ext    — static files in /public (favicon, llms.txt, manifest, …)
   *
   * Wider than the previous auth-only matcher because locale routing has to see
   * the marketing pages (`/`, `/faq`, `/guides/*`) too, not just the app shell.
   */
  matcher: ['/((?!api|_next|og-image|.*\\.[\\w]+$).*)'],
};
