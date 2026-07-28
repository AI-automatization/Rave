'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X } from 'lucide-react';
import { localeFromPath, parseAcceptLanguage, type Locale } from '@/lib/i18n/config';
import { localeSwitchFor, type LocaleSwitch } from '@/lib/i18n/routes';
import { useLocaleStore, readLocaleFromCookie } from '@/store/locale.store';

/**
 * Offers the visitor their browser language instead of forcing it on them.
 *
 * Shown only when: no language has been chosen yet, the browser asks for a
 * language this page is actually available in, and that language differs from
 * the one on screen. One click switches and remembers; dismissing remembers the
 * dismissal, so the banner never nags twice.
 *
 * Rendered client-side on purpose. The server response stays byte-identical for
 * every visitor and every crawler — no personalization, no cloaking risk, and
 * the marketing pages remain statically cacheable.
 *
 * Pinned to the bottom, not the top. In the document flow it rendered underneath
 * the `fixed top-0` page header and was completely invisible and unclickable —
 * the whole mechanism silently did nothing. Anchoring it to the bottom clears
 * every page header regardless of layout, and unlike a sticky top bar it shifts
 * no content, so it costs nothing in CLS on pages that exist to rank.
 */

const COPY: Record<Locale, { text: string; action: string }> = {
  ru: { text: 'Сайт доступен на русском', action: 'Смотреть на русском' },
  uz: { text: "Sayt o'zbek tilida ham bor", action: "O'zbekchada ko'rish" },
  en: { text: 'This page is available in English', action: 'View in English' },
};

const DISMISS_KEY = 'wewatch-locale-suggest-dismissed';

/**
 * localStorage, not sessionStorage: "never nags twice" has to outlive the tab,
 * otherwise every new browser session re-asks a visitor who already said no.
 *
 * Both accessors swallow their errors. Storage access throws outright when
 * cookies are blocked for the origin (embedded contexts, Safari's stricter
 * modes) — an uncaught throw here would kill the effect and take the banner
 * with it. Falling back to "not dismissed" is the harmless direction: the worst
 * case is the banner reappearing, not the mechanism disappearing.
 */
function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeDismissed(): void {
  try {
    localStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Nothing to do — the banner will simply be offered again next visit.
  }
}

export function LocaleSuggestBanner() {
  const pathname = usePathname();
  const setLocale = useLocaleStore((s) => s.setLocale);
  const [suggestion, setSuggestion] = useState<{ locale: Locale; via: LocaleSwitch } | null>(null);

  useEffect(() => {
    // The visitor already made a choice, or already said no — respect it silently.
    if (readLocaleFromCookie() || readDismissed()) return;

    // navigator.languages carries the same ordered preference list the browser
    // puts in Accept-Language, so the header can be reconstructed and parsed with
    // the exact q-weight logic the server would use.
    const header = navigator.languages?.length
      ? navigator.languages.map((tag, i) => `${tag};q=${(1 - i * 0.1).toFixed(1)}`).join(',')
      : navigator.language;

    const wanted = parseAcceptLanguage(header);
    const current = localeFromPath(pathname);
    if (!wanted || wanted === current) return;

    // Only offer a language this page is genuinely available in — pointing at a
    // fallback home page mid-article is worse than saying nothing.
    const via = localeSwitchFor(pathname, wanted);
    if (!via) return;

    setSuggestion({ locale: wanted, via });
  }, [pathname]);

  if (!suggestion) return null;

  const { locale, via } = suggestion;
  const copy = COPY[locale];

  const dismiss = () => {
    writeDismissed();
    setSuggestion(null);
  };

  // Both paths call setLocale, which is what writes the cookie — so the choice
  // survives the next visit and the proxy can act on it server-side.
  const accept = () => setLocale(locale);

  return (
    <div
      role="region"
      aria-label={copy.text}
      className="fixed bottom-3 inset-x-3 z-[60] mx-auto w-auto sm:max-w-md flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 pl-4 pr-10 sm:pr-4 py-3 rounded-2xl bg-[#111118]/95 backdrop-blur-xl border border-[#7B72F8]/30 shadow-[0_8px_30px_rgba(0,0,0,0.6)] text-sm text-center animate-in fade-in slide-in-from-bottom-4 duration-300"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <span className="text-zinc-300">{copy.text}</span>

      {via.mode === 'navigate' ? (
        // A real <a href>: middle-click and "open in new tab" behave, and the
        // target URL is the one hreflang advertises for this language.
        <Link
          href={via.href}
          hrefLang={locale}
          onClick={accept}
          className="font-medium text-[#7B72F8] hover:text-[#9A93FF] underline underline-offset-2 transition-colors"
        >
          {copy.action} →
        </Link>
      ) : (
        // No URL to go to — this page is translated in place by next-intl, so
        // switching the store re-renders it and the banner has nothing left to
        // offer. No arrow: nothing is being navigated to.
        <button
          type="button"
          onClick={() => {
            accept();
            setSuggestion(null);
          }}
          className="font-medium text-[#7B72F8] hover:text-[#9A93FF] underline underline-offset-2 transition-colors"
        >
          {copy.action}
        </button>
      )}

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
