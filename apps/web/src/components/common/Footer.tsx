'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { WeWatchLogo } from './WeWatchLogo';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-[#0A0A0F] border-t border-zinc-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand */}
          <div className="flex-shrink-0">
            <div className="mb-3">
              <WeWatchLogo iconSize={28} textSize="text-lg" />
            </div>
            <p className="text-zinc-600 text-sm max-w-[200px] leading-relaxed">
              {t('tagline')}
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{t('platform')}</p>
              <ul className="space-y-2">
                <li><Link href="/features" className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">{t('features')}</Link></li>
                <li><Link href="/pricing"  className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">{t('pricing')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{t('legal')}</p>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">{t('privacy')}</Link></li>
                <li><a href="mailto:copyright@wewatch.app" className="text-zinc-600 text-sm hover:text-zinc-300 transition-colors">{t('dmca')}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-zinc-800/60 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-zinc-700 text-xs">© {new Date().getFullYear()} WeWatch. {t('rights')}</p>
          <p className="text-zinc-700 text-xs">{t('country')}</p>
        </div>
      </div>
    </footer>
  );
}
