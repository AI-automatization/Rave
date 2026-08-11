/**
 * Registry of the use-case landing pages, one entry per scenario.
 *
 * Same shape and same reason as GUIDE_GROUPS in ./guides: the slugs are
 * translated, not prefixed (`/ru/use-cases/dalnie-otnosheniya` ↔
 * `/uz/use-cases/masofadagi-juftlik`), so nothing can derive one locale's URL
 * from another's by string surgery. Both the home-page cards and hreflang read
 * from here, which is what keeps the cards from linking at a page that does not
 * exist in the reader's language.
 */

import type { Locale } from '@/lib/i18n/config';

/**
 * All three locales are required, unlike GUIDE_GROUPS: every scenario page is
 * written in all three languages, and the home-page cards link to them
 * unconditionally. Making a locale optional here would let a card render
 * `href={undefined}`. If a scenario without a translation is ever added, widen
 * this type and handle the gap at both call sites — do not sneak in a partial row.
 */
export type UseCaseGroup = Record<Locale, string>;

export const USE_CASE_GROUPS: readonly UseCaseGroup[] = [
  {
    ru: '/ru/use-cases/dalnie-otnosheniya',
    uz: '/uz/use-cases/masofadagi-juftlik',
    en: '/en/use-cases/long-distance',
  },
  {
    ru: '/ru/use-cases/svidanie-online',
    uz: '/uz/use-cases/onlayn-uchrashuv',
    en: '/en/use-cases/online-date',
  },
];

/** Every locale variant of the use-case `path` belongs to, or undefined. */
export function getUseCaseGroup(path: string): UseCaseGroup | undefined {
  return USE_CASE_GROUPS.find((g) => g.ru === path || g.uz === path || g.en === path);
}

/** `path` in `target`, or null when `path` is not a use-case page at all. */
export function useCasePath(path: string, target: Locale): string | null {
  return getUseCaseGroup(path)?.[target] ?? null;
}

/** Scenario URLs keyed by locale, in registry order. */
export const LONG_DISTANCE = USE_CASE_GROUPS[0];
export const ONLINE_DATE = USE_CASE_GROUPS[1];
