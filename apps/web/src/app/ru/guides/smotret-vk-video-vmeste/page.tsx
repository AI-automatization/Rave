import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideSteps, GuideFAQ, GuideCTA } from '@/components/common/GuideArticleUI';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/ru/guides/smotret-vk-video-vmeste';

export const metadata: Metadata = {
  // No manual "| WeWatch" — the root layout's title template appends it.
  title: 'Смотреть VK Видео вместе с друзьями онлайн — синхронно',
  // "ВКонтакте" in Cyrillic, not only "VK": Google matches the query string it was
  // given. A page that only ever writes the Latin form gets "Не найдено: вконтакте"
  // printed under its result — measured on the YouTube guide, 159 impressions and
  // zero clicks, which is what the 2026-08-10 baseline traced this to.
  description:
    'Как смотреть VK Видео (ВКонтакте) вместе с друзьями через веб-версию WeWatch. Приложения iOS и Android находятся в разработке.',
  keywords: [
    'смотреть vk видео вместе', 'вк видео вместе с друзьями', 'смотреть вконтакте видео вместе',
    'watch party vk', 'синхронный просмотр vk видео', 'смотреть видео из вк вместе онлайн',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Смотреть VK Видео вместе | WeWatch',
    description: 'Синхронный просмотр VK Видео с друзьями — на любом устройстве.',
    url: 'https://wewatch.uz/ru/guides/smotret-vk-video-vmeste',
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
  { q: 'Работает с фильмами из VK?', a: 'Да, если видео доступно по поддерживаемой ссылке VK Видео.' },
  { q: 'Нужен ли аккаунт VK?', a: 'Публичные видео открываются без входа. Для приватных нужен доступ к ним в VK.' },
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

export default function VkVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="guide-page flex-1 bg-page text-white">
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>VK Видео вместе</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>Смотреть VK Видео вместе с друзьями</h1>
              <p>
            WeWatch синхронизирует VK Видео (ВКонтакте) для всех участников через веб-версию в браузере. Приложения для iOS и Android находятся в разработке.
              </p>
            </div>
            <GuideRoomMockup photo="couple-tv" priority />
          </div>
        </div>

        <div className="article shell py-12">

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как смотреть VK Видео вместе — 4 шага</h2>
            <GuideSteps
              steps={[
                { n: 1, title: 'Откройте WeWatch', desc: 'Откройте веб-версию в браузере; приложения iOS и Android разрабатываются.' },
                { n: 2, title: 'Найдите видео во ВКонтакте', desc: 'В браузере WeWatch откройте VK Видео и выберите ролик, клип или фильм.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите «Создать комнату» и отправьте ссылку-приглашение друзьям.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'WeWatch извлекает видеопоток VK и держит его синхронно у всех участников.' },
              ]}
            />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Почему обычная ссылка ВКонтакте не работает для просмотра вместе</h2>
            <p className="text-zinc-400 leading-relaxed">
              Если просто отправить ссылку на видео из ВК, каждый смотрит в своём темпе — синхронизации нет. WeWatch извлекает поток и держит единое время воспроизведения, поэтому вы видите один и тот же кадр одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Вопросы</h2>
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <GuideCTA title="Смотрите VK Видео вместе" subtitle="Откройте веб-версию WeWatch">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/guides/smotret-rutube-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">Rutube вместе →</Link>
            </div>
          </GuideCTA>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-vk-video-vmeste" />
    </>
  );
}
