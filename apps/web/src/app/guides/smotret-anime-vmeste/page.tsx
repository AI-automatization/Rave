import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  title: 'Смотреть аниме вместе с другом онлайн бесплатно',
  description: 'Смотрите аниме вместе с друзьями онлайн синхронно — через WeWatch. Любой сайт с аниме, бесплатно, без задержек. iOS и Android.',
  keywords: ['смотреть аниме вместе', 'смотреть аниме с другом онлайн', 'аниме watch party', 'смотреть аниме онлайн вместе бесплатно', 'совместный просмотр аниме'],
  alternates: {
    canonical: 'https://wewatch.uz/guides/smotret-anime-vmeste',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-anime-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/anime-birgalikda',
      'x-default': 'https://wewatch.uz/guides/smotret-anime-vmeste',
    },
  },
  openGraph: {
    title: 'Смотреть аниме вместе с другом | WeWatch',
    description: 'Синхронный просмотр аниме с друзьями — любой сайт, бесплатно, iOS и Android.',
    url: 'https://wewatch.uz/guides/smotret-anime-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть аниме вместе с другом онлайн',
  description: 'Гайд по совместному просмотру аниме через WeWatch — любой сайт, синхронно, бесплатно',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-15',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/smotret-anime-vmeste',
};

const ANIME_SITES = ['AnimeGo', 'Animejoy', 'Shikimori (YouTube)', 'AniLibria', 'YouTube (аниме-каналы)', 'VK Видео', 'Любой другой сайт'];
const RELATED = [
  { href: '/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/guides/smotret-serial-vmeste', label: 'Смотреть сериал вместе' },
  { href: '/guides/smotret-youtube-vmeste', label: 'Смотреть YouTube вместе' },
];

export default function SmotretAnimeVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/guides/smotret-vmeste-onlayn" className="hover:text-white transition-colors">Смотреть вместе</Link>
            <span className="mx-2">/</span>
            <span>Аниме вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть аниме вместе с другом онлайн
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch — лучший способ смотреть аниме с другом онлайн. Встроенный браузер открывает любой сайт с аниме, синхронизация работает в реальном времени. Вы видите один и тот же кадр — всегда.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Какие сайты с аниме поддерживаются?</h2>
            <p className="text-zinc-400 mb-4">WeWatch открывает любой сайт через встроенный браузер — ограничений нет:</p>
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
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Скачайте WeWatch', desc: 'Бесплатно в App Store или Google Play. Регистрация по номеру телефона — 30 секунд.' },
                { n: 2, title: 'Откройте любимый сайт с аниме', desc: 'В браузере WeWatch перейдите на AnimeGo, Animejoy, YouTube или любой другой сайт. Найдите серию.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите кнопку "Создать комнату" — WeWatch выдаст ссылку. Отправьте другу.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'Друг переходит по ссылке — просмотр синхронизируется автоматически. Можете обсуждать в чате прямо в WeWatch.' },
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
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Работает ли с субтитрами?', a: 'Да. Субтитры отображаются как обычно — каждый участник может выбрать свой язык субтитров независимо.' },
                { q: 'Можно ли смотреть аниме с двух разных устройств?', a: 'Да — один может быть на iPhone, другой на Android или в браузере на ноутбуке. Синхронизация работает между всеми платформами.' },
                { q: 'Есть ли ограничение по длительности просмотра?', a: 'Нет. Марафон аниме на 12 серий? Без проблем — WeWatch не ограничивает время сессии.' },
                { q: 'Это бесплатно?', a: 'Да, WeWatch полностью бесплатный. Скачайте приложение и начните смотреть аниме с другом прямо сейчас.' },
              ].map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
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
            <h2 className="text-2xl font-bold text-white mb-3">Смотри аниме вместе уже сегодня</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch бесплатно — синхронный просмотр с другом за 30 секунд</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Скачать бесплатно
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" />
    </>
  );
}
