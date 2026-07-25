'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  localeFromPath,
  parseAcceptLanguage,
  type Locale,
} from '@/lib/i18n/config';
import { translatedPath } from '@/lib/i18n/routes';

/**
 * Offers the visitor their browser language instead of forcing it on them.
 *
 * Shown only when: no language has been chosen yet, the browser asks for a
 * language this page actually exists in, and that language differs from the one
 * being displayed. One click switches and remembers; dismissing remembers the
 * current language, so the banner never nags twice.
 *
 * Rendered client-side on purpose. The server response stays byte-identical for
 * every visitor and every crawler — no personalization, no cloaking risk, and
 * the marketing pages remain statically cacheable.
 */

const COPY: Record<Locale, { text: string; action: string }> = {
  ru: { text: 'Сайт доступен на русском', action: 'Смотреть на русском' },
  uz: { text: "Sayt o'zbek tilida ham bor", action: "O'zbekchada ko'rish" },
  en: { text: 'This page is available in English', action: 'View in English' },
};

const DISMISS_KEY = 'wewatch-locale-suggest-dismissed';

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match?.[1] ?? null;
}

export function LocaleSuggestBanner() {
  const pathname = usePathname();
  const [suggestion, setSuggestion] = useState<{ locale: Locale; href: string } | null>(null);

  useEffect(() => {
    // The visitor already made a choice — respect it silently.
    if (readCookie(LOCALE_COOKIE) || sessionStorage.getItem(DISMISS_KEY)) return;

    // navigator.languages carries the same ordered preference list the browser
    // puts in Accept-Language, so the header can be reconstructed and parsed with
    // the exact q-weight logic the server would use.
    const header = navigator.languages?.length
      ? navigator.languages.map((tag, i) => `${tag};q=${(1 - i * 0.1).toFixed(1)}`).join(',')
      : navigator.language;

    const wanted = parseAcceptLanguage(header);
    const current = localeFromPath(pathname);
    if (!wanted || wanted === current) return;

    // Only suggest a language this page genuinely exists in — pointing at a
    // fallback home page mid-article is worse than saying nothing.
    const href = translatedPath(pathname, wanted);
    if (!href) return;

    setSuggestion({ locale: wanted, href });
  }, [pathname]);

  if (!suggestion) return null;

  const copy = COPY[suggestion.locale];

  const remember = (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
  };

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setSuggestion(null);
  };

  return (
    <div
      role="region"
      aria-label={copy.text}
      className="flex items-center justify-center gap-3 px-4 py-2.5 bg-[#7B72F8]/10 border-b border-[#7B72F8]/20 text-sm"
    >
      <span className="text-zinc-300">{copy.text}</span>
      <Link
        href={suggestion.href}
        onClick={() => remember(suggestion.locale)}
        className="font-medium text-[#7B72F8] hover:text-[#9A93FF] underline underline-offset-2 transition-colors"
      >
        {copy.action} →
      </Link>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Close"
        className="ml-1 p-1 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
