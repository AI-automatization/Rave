import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideSteps, GuideFAQ, GuideCTA } from '@/components/common/GuideArticleUI';

export const metadata: Metadata = {
  title: 'Смотреть аниме вместе с другом онлайн бесплатно',
  description: 'Смотрите аниме вместе с друзьями онлайн через веб-версию WeWatch. Приложения iOS и Android находятся в разработке.',
  keywords: ['смотреть аниме вместе', 'смотреть аниме с другом онлайн', 'аниме watch party', 'смотреть аниме онлайн вместе бесплатно', 'совместный просмотр аниме'],
  alternates: {
    canonical: 'https://wewatch.uz/ru/guides/smotret-anime-vmeste',
    languages: {
      'ru': 'https://wewatch.uz/ru/guides/smotret-anime-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/anime-birgalikda',
      'x-default': 'https://wewatch.uz/ru/guides/smotret-anime-vmeste',
    },
  },
  openGraph: {
    title: 'Смотреть аниме вместе с другом | WeWatch',
    description: 'Синхронный просмотр аниме с друзьями через бесплатную веб-версию. Приложения iOS и Android разрабатываются.',
    url: 'https://wewatch.uz/ru/guides/smotret-anime-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


const ANIME_SITES = ['YouTube (аниме-каналы)', 'VK Видео', 'Rutube', 'Прямая MP4-ссылка'];
const RELATED = [
  { href: '/ru/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/ru/guides/smotret-serial-vmeste', label: 'Смотреть сериал вместе' },
  { href: '/ru/guides/smotret-youtube-vmeste', label: 'Смотреть YouTube вместе' },
];


/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible
 * HTML, which is what makes that guarantee testable rather than a convention.
 */
const FAQS = [
  { q: 'Работает ли с субтитрами?', a: 'Да. Субтитры отображаются как обычно — каждый участник может выбрать свой язык субтитров независимо.' },
  { q: 'Можно ли смотреть аниме с двух разных устройств?', a: 'Да — откройте веб-версию в браузерах на iPhone, Android или ноутбуке. Нативные приложения разрабатываются.' },
  { q: 'Есть ли ограничение по длительности просмотра?', a: 'Нет. Марафон аниме на 12 серий? Без проблем — WeWatch не ограничивает время сессии.' },
  { q: 'Это бесплатно?', a: 'Основные функции доступны бесплатно в веб-версии. Мобильные приложения находятся в разработке.' },
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

export default function SmotretAnimeVmestePage() {
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
            <span>Аниме вместе</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>Смотреть аниме вместе с другом онлайн</h1>
              <p>
            WeWatch помогает смотреть аниме с другом онлайн через поддерживаемые источники: YouTube, VK Видео, Rutube и прямые MP4-ссылки. Синхронизация работает в реальном времени.
              </p>
            </div>
            <GuideRoomMockup />
          </div>
        </div>

        <div className="article max-w-5xl mx-auto px-4 py-10">

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Какие источники с аниме поддерживаются?</h2>
            <p className="text-zinc-400 mb-4">Используйте видео из одного из подтверждённых источников:</p>
            <ul className="grid grid-cols-2 gap-2 text-zinc-400 text-sm">
              {ANIME_SITES.map(s => (
                <li key={s} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7B72F8] flex-shrink-0" />{s}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть аниме вместе — 4 шага</h2>
            <GuideSteps
              steps={[
                { n: 1, title: 'Откройте WeWatch', desc: 'Откройте wewatch.uz в браузере. Приложения для iOS и Android находятся в разработке.' },
                { n: 2, title: 'Добавьте серию', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите кнопку "Создать комнату" — WeWatch выдаст ссылку. Отправьте другу.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'Друг переходит по ссылке — просмотр синхронизируется автоматически. Можете обсуждать в чате прямо в WeWatch.' },
              ]}
            />
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

          <GuideCTA title="Смотри аниме вместе уже сегодня" subtitle="Откройте WeWatch в браузере и смотрите синхронно с другом">
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Открыть веб-версию
            </Link>
          </GuideCTA>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-anime-vmeste" />
    </>
  );
}
