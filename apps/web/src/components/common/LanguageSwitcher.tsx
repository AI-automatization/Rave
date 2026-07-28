'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LOCALES, LOCALE_LABEL, localeFromPath } from '@/lib/i18n/config';
import { switchLocalePath, translatedPath } from '@/lib/i18n/routes';

/**
 * Switches language by navigating to the URL that language lives at. That is the
 * only mechanism now, and the only thing that writes the locale anywhere.
 *
 * Earlier versions also wrote a client store and a cookie, which produced two
 * different kinds of wrong page: on a page with no locale URL the language
 * changed but the address bar did not, so the page could not be shared or
 * indexed in that language; and the cookie then silently redirected the visitor
 * on unrelated links later. Every localized page has a URL now, so a plain <a>
 * does the whole job — middle-click and "open in new tab" included.
 */
export function LanguageSwitcher() {
  const pathname = usePathname();

  // The URL is the only source of truth for what is on screen.
  const current = localeFromPath(pathname) ?? 'ru';

  return (
    <div className="relative group">
      <button className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all text-sm">
        <span>{LOCALE_LABEL[current].flag}</span>
        <span className="hidden sm:inline text-xs">{LOCALE_LABEL[current].label}</span>
      </button>
      <div className="absolute right-0 top-full mt-1.5 w-40 bg-[#111118] border border-zinc-800 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 p-1">
        {LOCALES.map((locale) => {
          const { flag, label } = LOCALE_LABEL[locale];
          const isActive = locale === current;
          // Pages with no counterpart in that language fall back to its home
          // page, marked with ↗ so the jump is not mistaken for a broken link.
          const hasCounterpart = translatedPath(pathname, locale) !== null;

          return (
            <Link
              key={locale}
              href={switchLocalePath(pathname, locale)}
              hrefLang={locale}
              lang={locale}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#7B72F8]/15 text-[#7B72F8] font-medium'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <span>{flag}</span>
              <span>{label}</span>
              {!isActive && !hasCounterpart && (
                <span className="ml-auto text-[10px] text-zinc-600">↗</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
