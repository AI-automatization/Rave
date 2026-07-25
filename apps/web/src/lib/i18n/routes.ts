/**
 * Which pages actually exist in which language.
 *
 * Locale routing cannot just swap a prefix here: most pages are Russian-only,
 * and the translated guides use translated slugs (`/guides/smotret-anime-vmeste`
 * ↔ `/uz/guides/anime-birgalikda`). Sending a visitor to `/en/faq` because it
 * "should" exist produces a 404 and, worse, a 404 that Google can crawl from an
 * hreflang tag. So every cross-locale jump is resolved through this registry and
 * falls back to the target locale's home page when no counterpart exists.
 */

import { guideGroupFor } from '@/data/guides';
import { DEFAULT_LOCALE, type Locale, stripLocale, withLocale } from './config';

/**
 * Locale-free paths that exist in more than one language via a plain prefix.
 * Guides are excluded — their slugs differ per locale and come from the registry.
 */
const TRANSLATED_ROUTES: Record<string, readonly Locale[]> = {
  '/': ['ru', 'uz', 'en'],
  '/guides': ['ru', 'uz', 'en'],
  '/faq': ['ru', 'en'],
  '/how-it-works': ['ru', 'en'],
};

/**
 * URL of `pathname` in `target`, or null when that page has no counterpart.
 *
 * `pathname` may be prefixed or not; the locale it currently belongs to is
 * irrelevant, only the page identity matters.
 */
export function translatedPath(pathname: string, target: Locale): string | null {
  // Normalize away a trailing slash so `/guides/` and `/guides` resolve alike.
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  // Guides first: their slugs are translated, so prefix arithmetic would be wrong.
  const group = guideGroupFor(path);
  if (group) return group[target] ?? null;

  const bare = stripLocale(path);
  const locales = TRANSLATED_ROUTES[bare];
  if (locales?.includes(target)) return withLocale(bare, target);

  return null;
}

/**
 * Where the language switcher should navigate to. Falls back to the target
 * locale's home page rather than 404-ing on a page that is not translated yet.
 */
export function switchLocalePath(pathname: string, target: Locale): string {
  return translatedPath(pathname, target) ?? withLocale('/', target);
}

/** Locales `pathname` is actually available in — used for hreflang and the banner. */
export function availableLocales(pathname: string): Locale[] {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;

  const group = guideGroupFor(path);
  if (group) {
    return (['ru', 'uz', 'en'] as const).filter((l) => group[l]);
  }

  const bare = stripLocale(path);
  return [...(TRANSLATED_ROUTES[bare] ?? [DEFAULT_LOCALE])];
}

/**
 * hreflang map for a page, ready for Next's `alternates.languages`.
 * Only locales the page genuinely exists in are listed — an hreflang pointing at
 * a 404 is worse than a missing one, and Google reports it as an error.
 */
export function hreflangFor(pathname: string, baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of availableLocales(pathname)) {
    const path = translatedPath(pathname, locale);
    if (path) languages[locale] = path === '/' ? baseUrl : `${baseUrl}${path}`;
  }
  // x-default points at the default locale when it exists, else the first available.
  const fallback = languages[DEFAULT_LOCALE] ?? Object.values(languages)[0];
  if (fallback) languages['x-default'] = fallback;
  return languages;
}
