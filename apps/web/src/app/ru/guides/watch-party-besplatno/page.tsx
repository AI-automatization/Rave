import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideHeroWide, GuideFAQ, GuideCTA } from '@/components/common/GuideArticleUI';
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

/**
 * Rendered as the visible FAQ and published as FAQPage from this one array, so the
 * schema cannot drift from the page.
 *
 * This guide ranks for a money question, so the answers stay inside what
 * src/data/product-facts.ts actually asserts (verified 2026-08-06): core watch
 * party is free, Pro is `planned` with `purchaseAvailability: 'unavailable'` and
 * no published price. Saying "free forever" or naming a Pro price here would put
 * a claim on the page that nothing in the product backs.
 */
const FAQS = [
  {
    q: 'Что именно бесплатно в WeWatch?',
    a: 'Основные функции совместного просмотра: комната, синхронное воспроизведение, чат и реакции. Тариф Pro находится в подготовке — цена не объявлена, купить его пока нельзя.',
  },
  {
    q: 'Нужно ли привязывать карту, чтобы начать?',
    a: 'Нет. Оплата в WeWatch пока не подключена — начать просмотр можно сразу после создания комнаты.',
  },
  {
    q: 'Есть ли ограничение по времени просмотра?',
    a: 'Ограничения на длительность нет. Комната закрывается автоматически только после 10 минут без активности участников.',
  },
  {
    q: 'Сколько человек можно позвать бесплатно?',
    a: 'До 10 участников в одной комнате — это ограничение комнаты, а не тарифа.',
  },
  {
    q: 'Какие источники видео поддерживаются?',
    a: 'YouTube, VK Видео, Rutube и прямые MP4-ссылки. Доступ к самому видео определяется правилами выбранного источника.',
  },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'ru',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function WatchPartyBesplatnoPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="page-hero relative max-w-5xl mx-auto px-4 pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/ru/guides/smotret-vmeste-onlayn" className="hover:text-white transition-colors">Смотреть вместе</Link>
            <span className="mx-2">/</span>
            <span>Watch Party бесплатно</span>
          </nav>

          <GuideHeroWide photo="group-watch">
            <h1>Бесплатный Watch Party онлайн в 2026</h1>
            <p>
          Основные функции watch party WeWatch доступны бесплатно в веб-версии. Поддерживаются YouTube, VK Видео, Rutube и прямые MP4-ссылки; приложения для iOS и Android находятся в разработке.
            </p>
          </GuideHeroWide>
        </div>

        <div className="article max-w-5xl mx-auto px-4 py-10">

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
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Читайте также</h2>
            <div className="flex flex-col gap-2">
              {RELATED.map(({ href, label }) => (
                <Link key={href} href={href} className="text-[#7B72F8] hover:underline text-sm">→ {label}</Link>
              ))}
            </div>
          </section>

          <GuideCTA title="Начните Watch Party бесплатно" subtitle="Откройте бесплатную веб-версию WeWatch; приложения iOS и Android разрабатываются">
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Открыть веб-версию
            </Link>
          </GuideCTA>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/watch-party-besplatno" />
    </>
  );
}
