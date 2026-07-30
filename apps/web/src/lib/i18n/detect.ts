/**
 * Which language a visitor is sent to when they open `/`, and nothing else.
 *
 * This is deliberately the only place in the app where the visitor — rather than
 * the URL — decides a language, and it applies to exactly one path. `/ru/faq`,
 * `/uz`, `/en/guides/...` are never rewritten: a link someone shared has to open
 * the same page for everyone who clicks it, which is precisely what the old
 * cookie-based redirect broke.
 *
 * The signal is `Accept-Language`, not IP geolocation. IP tells you a country,
 * the header tells you a language, and the difference is not academic here: a
 * large share of Tashkent traffic reads Russian, so an IP rule would send those
 * visitors to the Uzbek pages against their stated preference. The header is
 * also sent on every request at no cost, needs no external database, and cannot
 * be wrong about a traveller or a VPN user the way an IP lookup is.
 *
 * Crawlers are exempt. Googlebot crawls predominantly from US IPs and sends no
 * meaningful `Accept-Language`, so anything derived from the visitor risks
 * showing the index a language that is not the site's default — the failure that
 * killed the two earlier attempts at this feature. Bots always get the
 * x-default locale, which is also what the hreflang tags advertise, and they
 * reach the other languages the way they are supposed to: through those tags.
 */

import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * Locale for a visitor whose browser asks for a language the site does not
 * have — Portuguese, German, Turkish. English is the international fallback;
 * sending a Brazilian visitor to the Russian home page helps no one.
 */
const FOREIGN_FALLBACK: Locale = 'en';

/**
 * Substrings that mark a non-human client. Most crawlers in `robots.ts` already
 * contain "bot" or "spider"; the rest are named explicitly, along with the link
 * preview fetchers used by messengers — a Telegram or WhatsApp preview should
 * describe the page that was actually shared, in the language it was shared in.
 *
 * Matching is a plain substring test on the lowercased UA. False positives cost
 * nothing (the client gets the default locale, one click from any other), while
 * a false negative would let a crawler be redirected by a header it never meant
 * as a preference.
 */
const CRAWLER_HINTS = [
  'bot',
  'crawler',
  'spider',
  'slurp',
  'crawling',
  'chatgpt-user',
  'claude-user',
  'perplexity-user',
  'anthropic-ai',
  'cohere-ai',
  'externalagent',
  'google-extended',
  'facebookexternalhit',
  'whatsapp',
  'skypeuripreview',
  'embedly',
  'quora link preview',
  'vkshare',
  'headlesschrome',
  'lighthouse',
];

/** Base language subtag: `ru-RU` → `ru`, `uz-Latn-UZ` → `uz`. */
function baseTag(tag: string): string {
  return tag.split('-')[0]?.toLowerCase() ?? '';
}

/**
 * The site language this `Accept-Language` header asks for.
 *
 * Returns null when the header is absent or says nothing usable — the caller
 * then falls back to x-default rather than guessing. A header that names only
 * languages the site does not have resolves to {@link FOREIGN_FALLBACK}: the
 * visitor did state a preference, it just is not one of ours, and English is a
 * better answer for them than Russian.
 *
 * Tags are honoured in q-value order, so `pt-BR,pt;q=0.9,en;q=0.8` yields
 * English rather than the fallback — the visitor listed English themselves.
 */
export function preferredLocale(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const quality = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        tag: tag?.trim().toLowerCase() ?? '',
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    // `q=0` means "explicitly not this one", and `*` states no preference at
    // all — neither can select a locale, so both drop out before ranking.
    .filter((entry) => entry.tag && entry.tag !== '*' && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality);

  if (ranked.length === 0) return null;

  for (const { tag } of ranked) {
    const base = baseTag(tag);
    if (isLocale(base)) return base;
  }

  return FOREIGN_FALLBACK;
}

/**
 * Whether this request comes from a crawler, preview fetcher or automated
 * client rather than a person reading the site.
 *
 * A missing User-Agent counts as one: no real browser omits it, and the safe
 * answer for an unidentified client is the default locale.
 */
export function isCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  const ua = userAgent.toLowerCase();
  return CRAWLER_HINTS.some((hint) => ua.includes(hint));
}

/**
 * Locale to send a `/` request to. Crawlers and unidentified clients get
 * x-default; everyone else gets the language their browser asked for, falling
 * back to x-default when it asked for nothing.
 */
export function localeForRoot(
  acceptLanguage: string | null | undefined,
  userAgent: string | null | undefined,
): Locale {
  if (isCrawler(userAgent)) return DEFAULT_LOCALE;
  return preferredLocale(acceptLanguage) ?? DEFAULT_LOCALE;
}
