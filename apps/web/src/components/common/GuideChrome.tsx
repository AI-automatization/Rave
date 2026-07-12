import Link from 'next/link';
import { WeWatchLogo } from './WeWatchLogo';

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
  },
};

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

export function GuideFooter({ locale = 'ru' }: { locale?: GuideLocale }) {
  const t = LABELS[locale];
  return (
    <footer className="border-t border-zinc-800/60 py-6 mt-8 bg-[#060608]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} WeWatch. {t.rights}</p>
        <div className="flex gap-4 text-zinc-600 text-xs">
          <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors">{t.privacy}</Link>
          <Link href="/terms" className="hover:text-zinc-400 transition-colors">{t.terms}</Link>
          <Link href={t.homeHref} className="hover:text-zinc-400 transition-colors">{t.backHome}</Link>
        </div>
      </div>
    </footer>
  );
}
