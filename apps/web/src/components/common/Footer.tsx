'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { FaInstagram, FaXTwitter, FaTelegram } from 'react-icons/fa6';
import { WeWatchLogo } from './WeWatchLogo';
import { SOCIAL_PROFILES } from '@/data/brand';
import { type Locale } from '@/lib/i18n/config';
import { useLocalizedHref } from '@/lib/i18n/use-localized-href';

// The row a visitor clicks. URLs come from data/brand.ts, which also feeds
// jsonLdOrg.sameAs — the two can no longer drift apart.
const SOCIAL_LINKS = [
  { href: SOCIAL_PROFILES.instagram, label: 'Instagram', Icon: FaInstagram },
  { href: SOCIAL_PROFILES.x, label: 'X (Twitter)', Icon: FaXTwitter },
  { href: SOCIAL_PROFILES.telegram, label: 'Telegram', Icon: FaTelegram },
] as const;

/** Language roots, in the order they are offered. Fixed targets — see the row below. */
const LOCALE_ROOTS: readonly { locale: Locale; href: string; label: string }[] = [
  { locale: 'ru', href: '/ru', label: 'Русский' },
  { locale: 'uz', href: '/uz', label: "O'zbekcha" },
  { locale: 'en', href: '/en', label: 'English' },
];

// Locale-aware guide links: sitewide internal links are the main crawl path
// to the SEO guide pages, so each locale points to its own language versions.
//
// `en` used to point at the Russian guides, because the only English-slug pages
// were noindex duplicates. Real English guides now exist under /en/guides, so it
// points there. There are three of them and five slots — anime and series both
// map to the movies guide, which covers series and anime episodes explicitly.
const GUIDE_LINKS: Record<string, { hub: string; watchTogether: string; movie: string; youtube: string; anime: string; serial: string }> = {
  ru: {
    hub: '/ru/guides',
    watchTogether: '/ru/guides/smotret-vmeste-onlayn',
    movie: '/ru/guides/kino-s-drugom-onlayn',
    youtube: '/ru/guides/smotret-youtube-vmeste',
    anime: '/ru/guides/smotret-anime-vmeste',
    serial: '/ru/guides/smotret-serial-vmeste',
  },
  uz: {
    hub: '/uz/guides',
    watchTogether: '/uz/guides/birgalikda-tomosha-qilish',
    movie: '/uz/guides/kino-birgalikda',
    youtube: '/uz/guides/youtube-birgalikda',
    anime: '/uz/guides/anime-birgalikda',
    serial: '/uz/guides/serial-birgalikda',
  },
  en: {
    hub: '/en/guides',
    watchTogether: '/en/guides/what-is-watch-party',
    movie: '/en/guides/watch-movies-with-friends',
    youtube: '/en/guides/watch-youtube-together',
    anime: '/en/guides/watch-movies-with-friends',
    serial: '/en/guides/watch-movies-with-friends',
  },
};

export function Footer() {
  const t = useTranslations('footer');
  const locale = useLocale();

  // Every internal link goes through this: the footer renders under all three
  // locale prefixes from one file, so a literal path is wrong in two of them.
  const L = useLocalizedHref();
  const guides = GUIDE_LINKS[locale] ?? GUIDE_LINKS.ru;

  return (
    <footer className="bg-page border-t border-zinc-800/60 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand */}
          <div className="flex-shrink-0">
            <div className="mb-3">
              <WeWatchLogo iconSize={28} textSize="text-lg" href={`/${locale}`} />
            </div>
            <p className="text-zinc-400 text-sm max-w-[200px] leading-relaxed">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-4 mt-4">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap gap-10 sm:gap-12">
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{t('platform')}</p>
              <ul className="space-y-2">
                <li><Link href={L('/ru/features')} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('features')}</Link></li>
                <li><Link href={L('/ru/how-it-works')} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('howItWorks')}</Link></li>
                <li><Link href={L('/ru/pricing')}  className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('pricing')}</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{t('guides')}</p>
              <ul className="space-y-2">
                <li><Link href={guides.watchTogether} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('guideWatchTogether')}</Link></li>
                <li><Link href={guides.movie} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('guideMovie')}</Link></li>
                <li><Link href={guides.youtube} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('guideYoutube')}</Link></li>
                <li><Link href={guides.anime} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('guideAnime')}</Link></li>
                <li><Link href={guides.serial} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('guideSerial')}</Link></li>
                <li><Link href={guides.hub} className="text-zinc-300 text-sm hover:text-white transition-colors">{t('allGuides')} →</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{t('company')}</p>
              <ul className="space-y-2">
                <li><Link href={L('/ru/company')} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('about')}</Link></li>
                <li><Link href={L('/ru/products')} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('products')}</Link></li>
                <li><Link href={L('/ru/team')} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('team')}</Link></li>
                <li><a href="https://www.tezcode.dev/" target="_blank" rel="noopener noreferrer" className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">tezcode.dev</a></li>
              </ul>
            </div>
            <div>
              <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-3">{t('legal')}</p>
              <ul className="space-y-2">
                <li><Link href="/privacy-policy" className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('privacy')}</Link></li>
                <li><Link href="/terms" className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('terms')}</Link></li>
                <li><Link href="/dmca" className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('dmca')}</Link></li>
                <li><Link href={L('/ru/faq')} className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('faq')}</Link></li>
                <li><Link href="/delete-account" className="text-zinc-400 text-sm hover:text-zinc-200 transition-colors">{t('deleteAccount')}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/*
          Sitewide entry points to the language roots — deliberately fixed links
          to /, /uz and /en rather than to the current page's translation. They
          exist for crawlers: without this row the localized roots were reachable
          only from the sitemap and sat in "Discovered, not indexed".

          Distinct from the header LanguageSwitcher, which translates *this page*.
        */}
        <div className="border-t border-zinc-800/60 mt-8 pt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-zinc-400 text-xs uppercase tracking-widest">{t('language')}</span>
          {LOCALE_ROOTS.map(({ locale, href, label }) => (
            <Link
              key={locale}
              href={href}
              hrefLang={locale}
              lang={locale}
              className="text-zinc-400 text-xs hover:text-zinc-200 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="border-t border-zinc-800/60 mt-6 pt-6 flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-zinc-400 text-xs">© {new Date().getFullYear()} WeWatch. {t('rights')}</p>
            <p className="text-zinc-400 text-xs">{t('country')}</p>
          </div>
          <p className="text-zinc-400 text-xs text-center sm:text-left">{t('madeBy')}</p>
        </div>
      </div>
    </footer>
  );
}
