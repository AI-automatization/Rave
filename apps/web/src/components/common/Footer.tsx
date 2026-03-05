'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');

  return (
    <footer className="bg-base-200 border-t border-base-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-display text-primary mb-2">CINESYNC</p>
            <p className="text-sm text-base-content/50">{t('tagline')}</p>
          </div>
          <div>
            <p className="font-medium text-sm mb-3">{t('platform')}</p>
            <ul className="space-y-2 text-sm text-base-content/60">
              <li><Link href="/features" className="hover:text-base-content transition-colors">{t('features')}</Link></li>
              <li><Link href="/pricing" className="hover:text-base-content transition-colors">{t('pricing')}</Link></li>
              <li><Link href="/register" className="hover:text-base-content transition-colors">{t('register')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-sm mb-3">{t('help')}</p>
            <ul className="space-y-2 text-sm text-base-content/60">
              <li><Link href="/faq" className="hover:text-base-content transition-colors">{t('faq')}</Link></li>
              <li><Link href="/contact" className="hover:text-base-content transition-colors">{t('contact')}</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-medium text-sm mb-3">{t('legal')}</p>
            <ul className="space-y-2 text-sm text-base-content/60">
              <li><Link href="/privacy" className="hover:text-base-content transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/terms" className="hover:text-base-content transition-colors">{t('terms')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-base-300 mt-8 pt-6 text-center text-xs text-base-content/40">
          © {new Date().getFullYear()} CineSync. {t('rights')}
        </div>
      </div>
    </footer>
  );
}
