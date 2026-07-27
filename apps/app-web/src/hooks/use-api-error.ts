'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { parseApiError } from '@/lib/api-error';

// Localised wrapper around parseApiError: the HTTP-status messages live in messages/*.json
// (common.http*) and need the active locale, which plain modules cannot read. Callers already
// pass their own translated fallback — this only fixes the status-code branch, which used to be
// hardcoded Russian regardless of the interface language.
export function useApiError() {
  const t = useTranslations('common');
  return useCallback(
    (err: unknown, fallback: string) => parseApiError(err, fallback, (key) => t(key)),
    [t],
  );
}
