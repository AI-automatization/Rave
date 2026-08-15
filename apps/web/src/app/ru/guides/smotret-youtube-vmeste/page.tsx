import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/ru/guides/smotret-youtube-vmeste';

export const metadata: Metadata = {
  title: 'Смотреть YouTube вместе с другом онлайн бесплатно',
  description: 'Как смотреть ютуб вместе с друзьями: синхронный просмотр YouTube через веб-версию WeWatch в браузере. Приложения iOS и Android в разработке.',
  keywords: ['смотреть youtube вместе', 'смотреть ютуб вместе с другом', 'youtube watch party', 'смотреть youtube одновременно', 'совместный просмотр youtube', 'youtube с друзьями онлайн'],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Смотреть YouTube вместе с другом | WeWatch',
    description: 'Синхронный просмотр YouTube с друзьями через WeWatch в браузере. Приложения iOS и Android разрабатываются.',
    url: 'https://wewatch.uz/ru/guides/smotret-youtube-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


const RELATED = [
  { href: '/ru/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/ru/guides/smotret-anime-vmeste', label: 'Смотреть аниме вместе' },
  { href: '/ru/guides/watch-party-besplatno', label: 'Watch party бесплатно' },
];

/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible
 * HTML, which is what makes that guarantee testable rather than a convention.
 */
const FAQS = [
  { q: 'Как смотреть ютуб вместе с другом бесплатно?', a: 'Откройте wewatch.uz в браузере, вставьте ссылку на видео и отправьте другу ссылку-приглашение. Совместный просмотр бесплатный.' },
  { q: 'Нужно ли обоим регистрироваться?', a: 'Нет. Аккаунт нужен тому, кто создаёт комнату и управляет воспроизведением. Гость заходит по ссылке-приглашению без регистрации.' },
  { q: 'Работает ли с YouTube Premium?', a: 'Да. WeWatch открывает YouTube в браузере — ваша подписка работает как обычно.' },
  { q: 'Есть ли задержка синхронизации?', a: 'Расхождение больше 500 мс исправляется автоматически — на глаз незаметно. WeWatch использует серверное время для точной синхронизации.' },
  { q: 'Можно ли смотреть ютуб вместе с телефона и компьютера?', a: 'Да — это главная особенность WeWatch. Один в браузере на телефоне, другой на ноутбуке — видео идёт синхронно.' },
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

export default function SmotretYoutubeVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="article max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/ru/guides/smotret-vmeste-onlayn" className="hover:text-white transition-colors">Смотреть вместе</Link>
            <span className="mx-2">/</span>
            <span>YouTube вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть YouTube вместе с другом онлайн
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch позволяет смотреть YouTube синхронно с друзьями — бесплатно, без задержек. Один участник ставит паузу или перематывает — остальные видят то же самое мгновенно.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Почему обычный ютуб не подходит для совместного просмотра?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              У ютуба нет встроенной функции watch party. Если ты и друг одновременно включите одно видео — через минуту вы будете на разных таймкодах из-за разной скорости интернета, рекламы и буферизации.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch решает это: веб-версия синхронизирует воспроизведение YouTube в реальном времени. Вы видите один и тот же кадр — всегда.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть ютуб вместе — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Откройте WeWatch', desc: 'Откройте wewatch.uz в браузере. Приложения для iOS и Android находятся в разработке.' },
                { n: 2, title: 'Добавьте видео YouTube', desc: 'Вставьте ссылку на нужное видео YouTube в веб-версии WeWatch.' },
                { n: 3, title: 'Нажмите "Создать комнату"', desc: 'WeWatch сгенерирует ссылку-приглашение. Отправьте другу в Telegram, WhatsApp или любом мессенджере.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'Как только друг открывает ссылку — просмотр синхронизируется автоматически. Пауза, перемотка, звук — всё работает для всех одновременно.' },
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
            <h2 className="text-2xl font-bold text-white mb-4">YouTube + WeWatch: что работает</h2>
            <ul className="space-y-3 text-zinc-400 text-sm">
              {[
                '✅ Все YouTube видео — клипы, фильмы, стримы, подкасты',
                '✅ Субтитры YouTube работают у каждого независимо',
                '✅ Качество видео каждый выбирает сам (1080p, 4K)',
                '✅ Работает без Premium-подписки YouTube',
                '✅ Веб-версия работает в браузерах на iPhone, Android и компьютере',
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
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
            <h2 className="text-2xl font-bold text-white mb-3">Попробуйте прямо сейчас</h2>
            <p className="text-zinc-400 mb-6">Откройте WeWatch в браузере и начните смотреть ютуб вместе с друзьями</p>
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Открыть веб-версию
            </Link>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-youtube-vmeste" />
    </>
  );
}
