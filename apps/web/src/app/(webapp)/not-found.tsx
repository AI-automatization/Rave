'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Home, ArrowLeft } from 'lucide-react';
import { WeWatchLogo } from '@/components/common/WeWatchLogo';
import { trackClick } from '@/lib/analytics';

// Until 2026-08-01 there was no not-found.tsx at all, so a bad URL fell through to Next.js's own
// black-and-white "404 | This page could not be found" — unbranded, untranslated, and with no way
// back into the app (prod audit). Client component so it can be translated: the locale lives in a
// client-side cookie, and this renders inside the root layout's Providers.
export default function NotFound() {
  const t = useTranslations('common');
  const tNav = useTranslations('nav');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center text-center">

        <div className="mb-8">
          <WeWatchLogo variant="stacked" iconSize={48} />
        </div>

        {/* The number carries the page — display font, and the same violet the whole app is
            built around rather than the neutral grey of the default screen. */}
        <p
          className="font-[family-name:var(--font-display)] text-[88px] leading-none font-bold tracking-tight mb-3"
          style={{
            background: 'linear-gradient(180deg, #A78BFA 0%, #7C3AED 60%, rgba(124,58,237,0.35) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          404
        </p>

        {/* Own key, not the shared `httpNotFound` — that one is the generic API-error string
            (src/lib/api-error.ts maps status 404 to it) and reads wrong as a page heading. */}
        <h1 className="text-xl font-bold text-white mb-2">{t('notFoundTitle')}</h1>
        <p className="text-sm text-slate-400 leading-relaxed mb-8 max-w-xs">
          {t('notFoundHint')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
          <Link
            href="/home"
            onClick={() => trackClick('404:go_home')}
            className="w-full sm:w-auto h-11 px-6 rounded-md text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors inline-flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Home size={15} />
            {tNav('home')}
          </Link>
          <button
            type="button"
            onClick={() => { trackClick('404:go_back'); window.history.back(); }}
            className="w-full sm:w-auto h-11 px-6 rounded-md text-sm font-medium text-slate-300 bg-white/[0.05] border border-white/[0.09] hover:bg-white/[0.1] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <ArrowLeft size={15} />
            {t('goBack')}
          </button>
        </div>

      </div>
    </div>
  );
}
