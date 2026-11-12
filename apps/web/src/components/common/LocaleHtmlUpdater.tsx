'use client';

import { useEffect } from 'react';
import { useLocaleStore } from '@/store/locale.store';

export function LocaleHtmlUpdater() {
  const locale = useLocaleStore((s) => s.locale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
