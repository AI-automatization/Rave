'use client';

import { NextIntlClientProvider } from 'next-intl';
import uzMessages from '../../../messages/uz.json';
import ruMessages from '../../../messages/ru.json';
import enMessages from '../../../messages/en.json';

const messages = { uz: uzMessages, ru: ruMessages, en: enMessages };

type Locale = 'uz' | 'ru' | 'en';

/**
 * Pins the locale for a URL-prefixed subtree (/uz, /en) via a nested
 * next-intl provider. Because the locale is a build-time prop — not read from
 * request headers — pages under it render statically in the correct language,
 * so the root layout no longer needs force-dynamic. The nearest provider wins,
 * overriding the ru-default provider from the root Providers.
 */
export function LocaleBoundary({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  );
}
