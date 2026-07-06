'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useLocaleStore } from '@/store/locale.store';

export function LocaleHtmlUpdater() {
  const locale = useLocaleStore((s) => s.locale);
  const pathname = usePathname();

  useEffect(() => {
    // /uz routes are Uzbek by URL — never let the client store downgrade SSR's lang="uz"
    const isUzRoute = pathname === '/uz' || pathname.startsWith('/uz/');
    document.documentElement.lang = isUzRoute ? 'uz' : locale;
  }, [locale, pathname]);

  return null;
}
