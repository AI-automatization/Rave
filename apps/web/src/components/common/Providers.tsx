'use client';

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

export function Providers({ children }: { children: React.ReactNode }) {
  const { locale } = useLocaleStore();

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
