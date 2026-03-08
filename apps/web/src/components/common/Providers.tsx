'use client';

import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { NextIntlClientProvider } from 'next-intl';
import { queryClient } from '@/lib/query-client';
import { useLocaleStore } from '@/store/locale.store';
import { Toaster } from '@/components/common/Toaster';
import uzMessages from '../../../messages/uz.json';
import ruMessages from '../../../messages/ru.json';
import enMessages from '../../../messages/en.json';

const messages = { uz: uzMessages, ru: ruMessages, en: enMessages };

type Locale = 'uz' | 'ru' | 'en';

export function Providers({ children }: { children: React.ReactNode }) {
  const localeFromStore = useLocaleStore((s) => s.locale);

  // Always start with 'uz' to match server-rendered HTML.
  // Zustand persist reads localStorage synchronously during hydration,
  // which causes #418 (mismatch) and #423 (state update during render).
  // Applying the persisted locale only after mount avoids both errors.
  const [locale, setLocale] = useState<Locale>('uz');

  useEffect(() => {
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
