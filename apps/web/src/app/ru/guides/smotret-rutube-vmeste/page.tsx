import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideSteps, GuideFAQ, GuideCTA } from '@/components/common/GuideArticleUI';

export const metadata: Metadata = {
  // No manual "| WeWatch" — the root layout's title template appends it.
  title: 'Смотреть Rutube вместе с друзьями онлайн — синхронно',
  description:
    'Как смотреть Рутуб вместе с друзьями через веб-версию WeWatch. Приложения iOS и Android находятся в разработке.',
  keywords: [
    'смотреть rutube вместе', 'рутьюб вместе с друзьями', 'смотреть rutube синхронно',
    'watch party rutube', 'совместный просмотр rutube', 'смотреть видео rutube вместе онлайн',
  ],
  alternates: { canonical: 'https://wewatch.uz/ru/guides/smotret-rutube-vmeste' },
  openGraph: {
    title: 'Смотреть Rutube вместе | WeWatch',
    description: 'Синхронный просмотр Rutube с друзьями — на любом устройстве.',
    url: 'https://wewatch.uz/ru/guides/smotret-rutube-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};



/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible
 * HTML, which is what makes that guarantee testable rather than a convention.
 */
const FAQS = [
  { q: 'Работает с фильмами на Рутубе?', a: 'Да, если видео доступно по поддерживаемой ссылке Rutube.' },
  { q: 'Нужен ли VPN?', a: 'Нет. WeWatch работает напрямую.' },
  { q: 'Это бесплатно?', a: 'Основные функции совместного просмотра WeWatch бесплатны.' },
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

export default function RutubeVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="guide-page flex-1 bg-page text-white">
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Rutube вместе</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>Смотреть Rutube вместе с друзьями</h1>
              <p>
            WeWatch синхронизирует Rutube (Рутуб) для всех участников через веб-версию в браузере. Приложения для iOS и Android находятся в разработке.
              </p>
            </div>
            <GuideRoomMockup photo="phone-video" priority />
          </div>
        </div>

        <div className="article shell py-12">

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как смотреть Rutube вместе — 4 шага</h2>
            <GuideSteps
              steps={[
                { n: 1, title: 'Откройте WeWatch', desc: 'Откройте веб-версию в браузере; приложения iOS и Android разрабатываются.' },
                { n: 2, title: 'Найдите видео на Рутубе', desc: 'В браузере WeWatch откройте Rutube и выберите фильм, сериал или ролик.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите «Создать комнату» и отправьте ссылку-приглашение друзьям.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'WeWatch извлекает поток Rutube и держит его синхронно у всех.' },
              ]}
            />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Рутуб без рассинхрона</h2>
            <p className="text-zinc-400 leading-relaxed">
              Рутуб по-разному грузится у разных людей, поэтому «включим одновременно» не работает. WeWatch держит единое время воспроизведения и компенсирует буферизацию — вы видите один кадр одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Вопросы</h2>
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <GuideCTA title="Смотрите Rutube вместе" subtitle="Откройте веб-версию WeWatch">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/guides/smotret-vk-video-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">VK Видео вместе →</Link>
            </div>
          </GuideCTA>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-rutube-vmeste" />
    </>
  );
}
