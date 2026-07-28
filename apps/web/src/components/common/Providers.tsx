'use client';

import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NextIntlClientProvider } from 'next-intl';
import { queryClient } from '@/lib/query-client';
import { useLocaleStore, readLocaleFromCookie } from '@/store/locale.store';
import { Toaster } from '@/components/common/Toaster';
import uzMessages from '../../../messages/uz.json';
import ruMessages from '../../../messages/ru.json';
import enMessages from '../../../messages/en.json';

const messages = { uz: uzMessages, ru: ruMessages, en: enMessages };

type Locale = 'uz' | 'ru' | 'en';

export function Providers({ children, initialLocale = 'ru' }: { children: React.ReactNode; initialLocale?: Locale }) {
  const localeFromStore = useLocaleStore((s) => s.locale);

  // Start from the URL-derived locale (passed by the server layout) so SSR output,
  // <html lang> and first client render all agree — no hydration mismatch.
  // After mount, update from cookie/store (a re-render, not an error).
  const [locale, setLocale] = useState<Locale>(initialLocale);

  // On the dedicated locale URLs (/uz, /en) the path is authoritative — the
  // cookie/store must not override it, otherwise a ru-cookie visitor sees the
  // English/Uzbek page flip back to Russian.
  const urlLocale = (): Locale | null => {
    if (typeof window === 'undefined') return null;
    const p = window.location.pathname;
    if (p === '/uz' || p.startsWith('/uz/')) return 'uz';
    if (p === '/en' || p.startsWith('/en/')) return 'en';
    return null;
  };

  useEffect(() => {
    // Order: URL beats cookie beats the server-rendered default. A visitor with
    // no cookie keeps initialLocale — the suggestion banner, not this effect, is
    // what offers them their browser language.
    const forced = urlLocale();
    setLocale(forced ?? readLocaleFromCookie() ?? initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    if (urlLocale()) return; // URL locale wins on /uz and /en
    setLocale(localeFromStore);
  }, [localeFromStore]);

  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={locale} messages={messages[locale]}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
