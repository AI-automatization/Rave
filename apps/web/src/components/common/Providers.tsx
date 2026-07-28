'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NextIntlClientProvider } from 'next-intl';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/common/Toaster';
import uzMessages from '../../../messages/uz.json';
import ruMessages from '../../../messages/ru.json';
import enMessages from '../../../messages/en.json';

const messages = { uz: uzMessages, ru: ruMessages, en: enMessages };

type Locale = 'uz' | 'ru' | 'en';

/**
 * Root provider. The locale it installs is the default one and never changes at
 * runtime — the `/uz` and `/en` subtrees override it with their own
 * `LocaleBoundary`, which the nearest-provider rule makes win.
 *
 * There used to be two effects here that re-read the locale from a cookie and a
 * zustand store after mount. That made the language a piece of client state
 * layered on top of the URL: the server rendered Russian, the client swapped it
 * a frame later, and on any page without a locale URL the visible language and
 * the address bar disagreed — so the page could not be shared or indexed in that
 * language. The locale is now purely a function of the path, decided on the
 * server, identical on every render.
 */
export function Providers({
  children,
  initialLocale = 'ru',
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextIntlClientProvider locale={initialLocale} messages={messages[initialLocale]}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
      </NextIntlClientProvider>
    </QueryClientProvider>
  );
}
