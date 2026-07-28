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
import { useCaseGroupFor } from '@/data/use-cases';
import { DEFAULT_LOCALE, type Locale, stripLocale, withLocale } from './config';

/**
 * Locale-free paths that exist in more than one language via a plain prefix.
 * Guides are excluded — their slugs differ per locale and come from the registry.
 */
const TRANSLATED_ROUTES: Record<string, readonly Locale[]> = {
  '/': ['ru', 'uz', 'en'],
  '/guides': ['ru', 'uz', 'en'],
  '/faq': ['ru', 'uz', 'en'],
  '/how-it-works': ['ru', 'uz', 'en'],
};

/**
 * Pages next-intl translates at render time, with no locale URL of their own:
 * one path serves all three languages and the locale store picks which. Their
 * copy lives entirely in `messages/{ru,uz,en}.json` under the namespaces listed
 * beside each route — verified present in all three files, so switching cannot
 * fall through to a raw key.
 *
 * They are deliberately *not* in TRANSLATED_ROUTES: that map drives hreflang and
 * the middleware redirect, and both need a distinct URL per language. Claiming a
 * `/uz/features` that does not exist would emit hreflang pointing at a 404.
 */
const STORE_LOCALIZED_ROUTES: readonly string[] = [
  '/features', // featuresPage + landing
  '/pricing', // pricingPage + landing
  '/products', // products
  '/company', // company
  '/contact', // company
  '/about', // aboutPage
];

/**
 * How to get `pathname` into `target`, or null when that is not possible.
 *
 * Two mechanisms, because the site localizes two different ways:
 *   'navigate'  — a real URL exists in the target language; go there. Shareable,
 *                 crawlable, and what hreflang advertises.
 *   'in-place'  — the page is translated by next-intl on the same URL; switching
 *                 the store re-renders it without navigating.
 *
 * Callers must not collapse these into one: navigating an in-place page would
 * dump the visitor on a home page, and switching the store on a URL-localized
 * page would show a language the URL contradicts.
 */
export type LocaleSwitch = { mode: 'navigate'; href: string } | { mode: 'in-place' };

export function localeSwitchFor(pathname: string, target: Locale): LocaleSwitch | null {
  const href = translatedPath(pathname, target);
  if (href) return { mode: 'navigate', href };

  if (STORE_LOCALIZED_ROUTES.includes(stripLocale(normalize(pathname)))) {
    return { mode: 'in-place' };
  }

  return null;
}

/** Trailing slash removed so `/guides/` and `/guides` resolve alike. */
function normalize(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/$/, '') : pathname;
}

/**
 * URL of `pathname` in `target`, or null when that page has no counterpart.
 *
 * `pathname` may be prefixed or not; the locale it currently belongs to is
 * irrelevant, only the page identity matters.
 */
export function translatedPath(pathname: string, target: Locale): string | null {
  const path = normalize(pathname);

  // Registries first: guide and use-case slugs are translated, so prefix
  // arithmetic on them would produce URLs that do not exist.
  const guide = guideGroupFor(path);
  if (guide) return guide[target] ?? null;

  const useCase = useCaseGroupFor(path);
  if (useCase) return useCase[target] ?? null;

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
  const path = normalize(pathname);

  const group = guideGroupFor(path) ?? useCaseGroupFor(path);
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
