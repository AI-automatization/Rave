'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocaleStore } from '@/store/locale.store';

export function LocaleHtmlUpdater() {
  const locale = useLocaleStore((s) => s.locale);
  const pathname = usePathname();

  useEffect(() => {
    // /uz and /en are locale-by-URL — never let the client store downgrade SSR's lang
    const isUzRoute = pathname === '/uz' || pathname.startsWith('/uz/');
    const isEnRoute = pathname === '/en' || pathname.startsWith('/en/');
    document.documentElement.lang = isUzRoute ? 'uz' : isEnRoute ? 'en' : locale;
  }, [locale, pathname]);

  return null;
}
