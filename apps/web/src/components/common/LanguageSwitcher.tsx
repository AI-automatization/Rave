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
import { localeSwitchFor, switchLocalePath } from '@/lib/i18n/routes';

/**
 * Switches language the way the current page is localized — by navigating where
 * a translated URL exists, in place where the page is translated by next-intl on
 * a single URL.
 *
 * An earlier version only wrote to the client store, so on /uz and /en (where
 * Providers treats the path as authoritative) the button did nothing, and
 * elsewhere it produced a language the URL did not advertise. Making every entry
 * an <a href> fixed that but overcorrected: pages like /features have no locale
 * URL, so switching there fell back to switchLocalePath's home page and threw the
 * visitor off the page they were reading — even though the translation existed
 * and was one re-render away. localeSwitchFor picks the right mechanism per page.
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
          const via = localeSwitchFor(pathname, locale);
          const isActive = locale === current;
          const itemClass = `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive
              ? 'bg-[#7B72F8]/15 text-[#7B72F8] font-medium'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
          }`;

          // Page translated in place, or not translated at all. The former stays
          // put and re-renders; the latter falls back to that locale's home page,
          // marked with ↗ so the jump is not mistaken for a broken translation.
          if (!via || via.mode === 'in-place') {
            return via ? (
              <button
                key={locale}
                type="button"
                lang={locale}
                onClick={() => setLocale(locale)}
                className={itemClass}
              >
                <span>{flag}</span>
                <span>{label}</span>
              </button>
            ) : (
              <Link
                key={locale}
                href={switchLocalePath(pathname, locale)}
                hrefLang={locale}
                onClick={() => setLocale(locale)}
                className={itemClass}
              >
                <span>{flag}</span>
                <span>{label}</span>
                {!isActive && <span className="ml-auto text-[10px] text-zinc-600">↗</span>}
              </Link>
            );
          }

          return (
            <Link
              key={locale}
              href={via.href}
              hrefLang={locale}
              onClick={() => setLocale(locale)}
              className={itemClass}
            >
              <span>{flag}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
