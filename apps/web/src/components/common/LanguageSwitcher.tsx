'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocaleStore } from '@/store/locale.store';
import {
  LOCALES,
  LOCALE_LABEL,
  localeFromPath,
  type Locale,
} from '@/lib/i18n/config';
import { switchLocalePath, translatedPath } from '@/lib/i18n/routes';

/**
 * Switches language by navigating, not by re-rendering.
 *
 * The previous version only wrote to the client store, which meant the URL never
 * changed — so on /uz and /en (where Providers treats the path as authoritative)
 * the button did nothing at all, and elsewhere it produced a language the URL
 * did not advertise, invisible to crawlers and unshareable.
 *
 * Each entry is a real <a href>: crawlers see the translated URL, and the choice
 * is persisted in a cookie so the middleware can honour it on the next visit.
 */
export function LanguageSwitcher() {
  const pathname = usePathname();
  const setLocale = useLocaleStore((s) => s.setLocale);

  // The URL is the source of truth for what is on screen; the store is only the
  // remembered preference, and the two disagree on an unprefixed shared link.
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
          const href = switchLocalePath(pathname, locale);
          // Untranslated pages fall back to that locale's home page — worth
          // flagging so the click is not mistaken for a broken translation.
          const isFallback = translatedPath(pathname, locale) === null;

          return (
            <Link
              key={locale}
              href={href}
              hrefLang={locale}
              onClick={() => setLocale(locale)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                locale === current
                  ? 'bg-[#7B72F8]/15 text-[#7B72F8] font-medium'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
              }`}
            >
              <span>{flag}</span>
              <span>{label}</span>
              {isFallback && locale !== current && (
                <span className="ml-auto text-[10px] text-zinc-600">↗</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
