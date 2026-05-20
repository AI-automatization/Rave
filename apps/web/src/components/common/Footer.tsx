'use client';

import Link from 'next/link';
import { FaPlay } from 'react-icons/fa';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-[#0A0A0F] border-t border-zinc-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand */}
          <div className="flex-shrink-0">
            <Link href="/" className="inline-flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-[#7B72F8] flex items-center justify-center shadow-[0_0_12px_rgba(123,114,248,0.4)]">
                <FaPlay size={9} className="text-white ml-0.5" />
              </div>
              <span className="text-lg font-display text-white tracking-wide">
                WE<span className="text-[#7B72F8]">WATCH</span>
              </span>
            </Link>
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
