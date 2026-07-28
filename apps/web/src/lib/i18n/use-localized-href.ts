'use client';

import { useLocale } from 'next-intl';
import { isLocale } from './config';
import { translatedPath } from './routes';

/**
 * Rewrites an internal link into the language the page is currently rendered in.
 *
 * The shared marketing components (nav, footer, the landing content blocks) are
 * rendered under all three locale prefixes from one source file, so any path
 * written literally in them is wrong in two of the three languages: an Uzbek
 * reader clicking "Narxlar" in the nav would land on the Russian /ru/pricing.
 *
 * Pass the path in any locale — only the page identity matters, the prefix is
 * recomputed. Paths with no version in the current language fall through
 * unchanged rather than dumping the reader on a home page.
 */
export function useLocalizedHref(): (path: string) => string {
  const locale = useLocale();
  return (path: string) => (isLocale(locale) ? translatedPath(path, locale) ?? path : path);
}
