import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';

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
  alternates: { canonical: 'https://wewatch.uz/ru/guides/smotret-vk-video-vmeste' },
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
      <main className="flex-1 bg-page text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>VK Видео вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Смотреть VK Видео вместе с друзьями</h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch синхронизирует VK Видео (ВКонтакте) для всех участников через веб-версию в браузере. Приложения для iOS и Android находятся в разработке.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как смотреть VK Видео вместе — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Откройте WeWatch', desc: 'Откройте веб-версию в браузере; приложения iOS и Android разрабатываются.' },
                { n: 2, title: 'Найдите видео во ВКонтакте', desc: 'В браузере WeWatch откройте VK Видео и выберите ролик, клип или фильм.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите «Создать комнату» и отправьте ссылку-приглашение друзьям.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'WeWatch извлекает видеопоток VK и держит его синхронно у всех участников.' },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#7B72F8] flex items-center justify-center text-sm font-bold">{n}</span>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{title}</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Почему обычная ссылка ВКонтакте не работает для просмотра вместе</h2>
            <p className="text-zinc-400 leading-relaxed">
              Если просто отправить ссылку на видео из ВК, каждый смотрит в своём темпе — синхронизации нет. WeWatch извлекает поток и держит единое время воспроизведения, поэтому вы видите один и тот же кадр одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Вопросы</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Смотрите VK Видео вместе</h2>
            <p className="text-zinc-400 mb-6">Откройте веб-версию WeWatch</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Открыть WeWatch</Link>
              <Link href="/ru/guides/smotret-rutube-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">Rutube вместе →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-vk-video-vmeste" />
    </>
  );
}
