/**
 * Single source of truth for locale routing.
 *
 * URL shape (`localePrefix: 'always'`): every locale carries its own prefix —
 * `/ru/faq`, `/uz/faq`, `/en/faq`. No language is a special case of the routing,
 * and the URL alone says what language a page is in.
 *
 * Russian used to sit at the root unprefixed, because the site was indexed that
 * way and moving it costs a 301 on every ranking URL. That move was made
 * deliberately on 2026-07-28 (T-S193, Jasur's call): the redirects are in
 * next.config.mjs, `/` 301s to `/ru`, and Google follows 301s and transfers
 * ranking — the cost is a few weeks of fluctuation, not a permanent loss.
 */

export const LOCALES = ['ru', 'uz', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

/** Locale used as hreflang x-default and as the target of `/`. */
export const DEFAULT_LOCALE: Locale = 'ru';

/** When true the default locale also gets a prefix (`/ru/faq`). See note above. */
export const PREFIX_DEFAULT = true;

/**
 * There is deliberately no locale cookie, no IP lookup and no Accept-Language
 * branch anywhere in this app. The URL says which language a page is in, and it
 * says the same thing to everyone — first-time visitor, returning visitor, new
 * account, crawler. Anything derived from the visitor instead of the URL either
 * misses the people who have no history yet, or hands two people who opened the
 * same link two different pages. `LanguageSwitcher` is the only way the language
 * changes, and it changes it by navigating.
 */

/** OpenGraph locale codes, per locale. */
export const OG_LOCALE: Record<Locale, string> = {
  ru: 'ru_RU',
  uz: 'uz_UZ',
  en: 'en_US',
};

export const LOCALE_LABEL: Record<Locale, { flag: string; label: string }> = {
  uz: { flag: '🇺🇿', label: "O'zbek" },
  ru: { flag: '🇷🇺', label: 'Русский' },
  en: { flag: '🇬🇧', label: 'English' },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/** Locales that carry a URL prefix under the current PREFIX_DEFAULT setting. */
const PREFIXED_LOCALES = LOCALES.filter((l) => PREFIX_DEFAULT || l !== DEFAULT_LOCALE);

/**
 * Locale a pathname belongs to, taken from its prefix. Unprefixed paths belong
 * to the default locale (or, if PREFIX_DEFAULT is on, have no locale yet).
 */
export function localeFromPath(pathname: string): Locale | null {
  for (const locale of PREFIXED_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) return locale;
  }
  return PREFIX_DEFAULT ? null : DEFAULT_LOCALE;
}

/** Pathname with any locale prefix removed (`/uz/guides` → `/guides`, `/uz` → `/`). */
export function stripLocale(pathname: string): string {
  for (const locale of PREFIXED_LOCALES) {
    if (pathname === `/${locale}`) return '/';
    if (pathname.startsWith(`/${locale}/`)) return pathname.slice(`/${locale}`.length);
  }
  return pathname;
}

/** Prefixes a locale-free pathname for `locale` (`/guides` + uz → `/uz/guides`). */
export function withLocale(pathname: string, locale: Locale): string {
  const bare = stripLocale(pathname);
  if (locale === DEFAULT_LOCALE && !PREFIX_DEFAULT) return bare;
  return bare === '/' ? `/${locale}` : `/${locale}${bare}`;
}
