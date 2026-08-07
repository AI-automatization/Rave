import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/ru/guides/watch-party-besplatno';

export const metadata: Metadata = {
  title: 'Бесплатный Watch Party онлайн — как начать в 2026',
  description: 'Бесплатный веб Watch Party: смотри YouTube, VK и Rutube синхронно с друзьями. Приложения iOS и Android находятся в разработке.',
  keywords: ['watch party бесплатно', 'бесплатный watch party', 'watch party онлайн', 'как создать watch party', 'совместный просмотр бесплатно'],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Watch Party бесплатно | WeWatch',
    description: 'Бесплатный веб watch party для синхронного просмотра YouTube, VK и Rutube. Приложения iOS и Android в разработке.',
    url: 'https://wewatch.uz/ru/guides/watch-party-besplatno',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


const VERIFIED_FACTS = [
  'Основные функции совместного просмотра бесплатны',
  'Поддерживаются YouTube, VK Видео, Rutube и прямые MP4-ссылки',
  'Веб-версия работает в браузерах на телефонах и компьютерах',
  'В одной комнате могут находиться до 10 участников',
  'В комнате доступны чат и эмодзи-реакции',
  'Нативные приложения iOS и Android находятся в разработке',
];

const RELATED = [
  { href: '/ru/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/ru/pricing', label: 'Тарифы WeWatch' },
  { href: '/ru/guides/smotret-youtube-vmeste', label: 'YouTube вместе' },
];

export default function WatchPartyBesplatnoPage() {
  return (
    <>
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/ru/guides/smotret-vmeste-onlayn" className="hover:text-white transition-colors">Смотреть вместе</Link>
            <span className="mx-2">/</span>
            <span>Watch Party бесплатно</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Бесплатный Watch Party онлайн в 2026
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Основные функции watch party WeWatch доступны бесплатно в веб-версии. Поддерживаются YouTube, VK Видео, Rutube и прямые MP4-ссылки; приложения для iOS и Android находятся в разработке.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Что доступно в бесплатном Watch Party WeWatch</h2>
            <p className="text-zinc-400 leading-relaxed">
              Ниже перечислены только функции и ограничения, подтверждённые текущей веб-версией. Сравнение с конкурентами не публикуется без датированного исследования и проверяемых источников.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Проверенные возможности WeWatch</h2>
            <ul className="space-y-3 text-zinc-400 text-sm">
              {VERIFIED_FACTS.map((fact) => <li key={fact}>✅ {fact}</li>)}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Читайте также</h2>
            <div className="flex flex-col gap-2">
              {RELATED.map(({ href, label }) => (
                <Link key={href} href={href} className="text-[#7B72F8] hover:underline text-sm">→ {label}</Link>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Начните Watch Party бесплатно</h2>
            <p className="text-zinc-400 mb-6">Откройте бесплатную веб-версию WeWatch; приложения iOS и Android разрабатываются</p>
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Открыть веб-версию
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/ru/guides/watch-party-besplatno" />
    </>
  );
}
