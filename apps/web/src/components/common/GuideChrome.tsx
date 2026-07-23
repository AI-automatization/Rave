import Link from 'next/link';
import { WeWatchLogo } from './WeWatchLogo';
import { relatedGuides } from '@/data/guides';

// Static chrome for standalone SEO pages (/guides/*, /uz/guides/*): server
// components with zero client JS so guide pages stay fully static and light.
type GuideLocale = 'ru' | 'uz';

const LABELS: Record<GuideLocale, {
  home: string;
  homeHref: string;
  faq: string;
  cta: string;
  privacy: string;
  terms: string;
  rights: string;
  backHome: string;
  related: string;
  allGuides: string;
  guidesHref: string;
}> = {
  ru: {
    home: 'Главная',
    homeHref: '/',
    faq: 'FAQ',
    cta: 'Начать бесплатно',
    privacy: 'Конфиденциальность',
    terms: 'Условия',
    rights: 'Все права защищены.',
    backHome: '← На главную',
    related: 'Другие гайды',
    allGuides: 'Все гайды →',
    guidesHref: '/guides',
  },
  uz: {
    home: 'Bosh sahifa',
    homeHref: '/uz',
    faq: 'FAQ',
    cta: 'Bepul boshlash',
    privacy: 'Maxfiylik',
    terms: 'Shartlar',
    rights: 'Barcha huquqlar himoyalangan.',
    backHome: '← Bosh sahifaga',
    related: 'Boshqa gaydlar',
    allGuides: 'Barcha gaydlar →',
    guidesHref: '/uz/guides',
  },
};

/**
 * Cross-links between guides in the same language. Guides reachable only from
 * sitemap.xml stall in Google's "Discovered, currently not indexed" bucket —
 * these links are the crawl path that gets them picked up.
 */
export function RelatedGuides({
  currentPath,
  locale = 'ru',
}: {
  currentPath: string;
  locale?: GuideLocale;
}) {
  const t = LABELS[locale];
  const items = relatedGuides(currentPath, locale);
  if (items.length === 0) return null;

  return (
    <nav aria-label={t.related} className="max-w-4xl mx-auto px-4 sm:px-6 mt-14">
      <div className="border-t border-zinc-800/60 pt-8">
        <div className="flex items-baseline justify-between gap-4 mb-5">
          <h2 className="text-white font-semibold text-lg">{t.related}</h2>
          <Link href={t.guidesHref} className="text-[#7B72F8] hover:text-[#9B92FF] text-sm transition-colors">
            {t.allGuides}
          </Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((g) => (
            <li key={g.path}>
              <Link
                href={g.path}
                className="block h-full rounded-xl border border-zinc-800/60 bg-[#0E0E14] px-5 py-4 hover:border-[#7B72F8]/40 transition-colors"
              >
                <span className="block text-white text-sm font-medium mb-1">{g.title}</span>
                <span className="block text-zinc-500 text-xs leading-relaxed">{g.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function GuideHeader({ locale = 'ru' }: { locale?: GuideLocale }) {
  const t = LABELS[locale];
  return (
    <header className="sticky top-0 z-50 bg-[#060608]/90 backdrop-blur-md border-b border-zinc-800/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <WeWatchLogo iconSize={26} textSize="text-lg" href={t.homeHref} />
        <nav className="flex items-center gap-3 sm:gap-5 text-sm">
          <Link href={t.homeHref} className="text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            {t.home}
          </Link>
          <Link href="/faq" className="text-zinc-400 hover:text-white transition-colors">
            {t.faq}
          </Link>
          <Link
            href="/register"
            className="h-8 px-3.5 rounded-full bg-[#7B72F8] text-white hover:bg-[#6B63E8] transition-colors text-xs sm:text-sm font-semibold flex items-center whitespace-nowrap"
          >
            {t.cta}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/**
 * Pass `currentPath` to also render the related-guides block above the footer bar
 * (omit it on pages that are not themselves guides).
 */
export function GuideFooter({
  locale = 'ru',
  currentPath,
}: {
  locale?: GuideLocale;
  currentPath?: string;
}) {
  const t = LABELS[locale];
  return (
    <>
      {currentPath && <RelatedGuides currentPath={currentPath} locale={locale} />}
      <footer className="border-t border-zinc-800/60 py-6 mt-8 bg-[#060608]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} WeWatch. {t.rights}</p>
          <div className="flex gap-4 text-zinc-600 text-xs">
            <Link href={t.guidesHref} className="hover:text-zinc-400 transition-colors">{t.allGuides}</Link>
            <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors">{t.privacy}</Link>
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">{t.terms}</Link>
            <Link href={t.homeHref} className="hover:text-zinc-400 transition-colors">{t.backHome}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
