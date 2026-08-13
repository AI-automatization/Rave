'use client';

import { useCallback } from 'react';
import { useLocaleStore } from '@/store/locale.store';

// `uz` is not reliably present in every browser's ICU data; `uz-Latn` resolves where plain `uz`
// sometimes falls back to the default locale. `en` stays last so the chain always terminates.
const INTL_LOCALE: Record<string, string[]> = {
  uz: ['uz-Latn', 'uz', 'en'],
  ru: ['ru', 'en'],
  en: ['en'],
};

const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60,        unit: 'second' },
  { amount: 60,        unit: 'minute' },
  { amount: 24,        unit: 'hour' },
  { amount: 7,         unit: 'day' },
  { amount: 4.34524,   unit: 'week' },
  { amount: 12,        unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

/**
 * Localised "3 minutes ago". Replaces the hand-rolled `${mins}m ago` helpers that were duplicated
 * across NotificationsContent and HomeContent — those emitted English on the uz and ru versions of
 * the page regardless of the language switcher (prod audit 2026-08-01).
 */
export function useRelativeTime() {
  const locale = useLocaleStore((s) => s.locale);

  return useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';

    const rtf = new Intl.RelativeTimeFormat(INTL_LOCALE[locale] ?? INTL_LOCALE.en, {
      numeric: 'auto',
    });

    let duration = (date.getTime() - Date.now()) / 1000;
    for (const { amount, unit } of DIVISIONS) {
      if (Math.abs(duration) < amount) {
        return rtf.format(Math.round(duration), unit);
      }
      duration /= amount;
    }
    return rtf.format(Math.round(duration), 'year');
  }, [locale]);
}
