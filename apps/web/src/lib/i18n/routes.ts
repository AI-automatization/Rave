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
 *
 * Every entry here must have a real page file per locale. This map drives both
 * hreflang and the language switcher, so a route listed without its `/uz` or
 * `/en` counterpart advertises a 404 to Google.
 *
 * The six marketing pages below used to be missing from this map on purpose:
 * they were translated at render time from the client locale store, on one
 * shared URL. That made them unshareable and unindexable in Uzbek and English —
 * `/features` was one URL that showed a different language depending on client
 * state. They now have their own URLs under /uz and /en, and the store is gone.
 */
const TRANSLATED_ROUTES: Record<string, readonly Locale[]> = {
  '/': ['ru', 'uz', 'en'],
  '/guides': ['ru', 'uz', 'en'],
  '/faq': ['ru', 'uz', 'en'],
  '/how-it-works': ['ru', 'uz', 'en'],
  '/features': ['ru', 'uz', 'en'],
  '/pricing': ['ru', 'uz', 'en'],
  '/products': ['ru', 'uz', 'en'],
  '/company': ['ru', 'uz', 'en'],
  '/contact': ['ru', 'uz', 'en'],
  '/about': ['ru', 'uz', 'en'],
};

/**
 * How to get `pathname` into `target`, or null when that page has no version in
 * that language.
 *
 * One mechanism only: navigate to the URL that language lives at. There used to
 * be a second, `{mode:'in-place'}`, which re-rendered the page in another
 * language without changing the URL — that is what made the visible language
 * disagree with the address bar. Every localized page now has a URL.
 */
export type LocaleSwitch = { mode: 'navigate'; href: string };

export function localeSwitchFor(pathname: string, target: Locale): LocaleSwitch | null {
  const href = translatedPath(pathname, target);
  return href ? { mode: 'navigate', href } : null;
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
