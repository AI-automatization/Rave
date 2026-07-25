import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/guides/smotret-youtube-vmeste';

export const metadata: Metadata = {
  title: 'Смотреть YouTube вместе с другом онлайн бесплатно',
  description: 'Как смотреть YouTube с друзьями одновременно — синхронный просмотр через WeWatch. Один ставит паузу — все ставят паузу. Бесплатно, iOS и Android.',
  keywords: ['смотреть youtube вместе', 'смотреть ютуб вместе с другом', 'youtube watch party', 'смотреть youtube одновременно', 'совместный просмотр youtube', 'youtube с друзьями онлайн'],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Смотреть YouTube вместе с другом | WeWatch',
    description: 'Синхронный просмотр YouTube с друзьями — бесплатно через WeWatch. Работает на iPhone, Android и в браузере.',
    url: 'https://wewatch.uz/guides/smotret-youtube-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть YouTube вместе с другом онлайн',
  description: 'Пошаговый гайд по синхронному просмотру YouTube через WeWatch',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-15',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/smotret-youtube-vmeste',
};

const RELATED = [
  { href: '/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/guides/smotret-anime-vmeste', label: 'Смотреть аниме вместе' },
  { href: '/guides/watch-party-besplatno', label: 'Watch party бесплатно' },
];

export default function SmotretYoutubeVmestePage() {
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
            <span>YouTube вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть YouTube вместе с другом онлайн
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch позволяет смотреть YouTube синхронно с друзьями — бесплатно, без задержек. Один участник ставит паузу или перематывает — остальные видят то же самое мгновенно.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Почему обычный YouTube не подходит для совместного просмотра?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              YouTube не имеет встроенной функции watch party. Если ты и друг одновременно включите одно видео — через минуту вы будете на разных таймкодах из-за разной скорости интернета, рекламы и буферизации.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch решает это: встроенный браузер синхронизирует воспроизведение в реальном времени. Вы видите один и тот же кадр — всегда.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть YouTube вместе — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Скачайте WeWatch', desc: 'App Store (iOS) или Google Play (Android). Бесплатно, установка 30 секунд.' },
                { n: 2, title: 'Откройте YouTube в браузере WeWatch', desc: 'Встроенный браузер работает как обычный — найдите видео на YouTube, VK или любом другом сайте.' },
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
                '✅ Кросс-платформа: один на iPhone, другой на Android или в браузере',
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Нужно ли обоим иметь WeWatch?', a: 'Создателю комнаты нужно приложение. Гость может зайти по ссылке.' },
                { q: 'Работает ли с YouTube Premium?', a: 'Да. WeWatch открывает YouTube в браузере — ваша подписка работает как обычно.' },
                { q: 'Есть ли задержка синхронизации?', a: 'Меньше 500 мс — практически незаметно. WeWatch использует серверное время для точной синхронизации.' },
                { q: 'Можно ли смотреть YouTube вместе с телефона и компьютера?', a: 'Да — это главная особенность WeWatch. Один на iPhone, другой в браузере на ноуте — видео идёт синхронно.' },
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
            <h2 className="text-2xl font-bold text-white mb-3">Попробуйте прямо сейчас</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch и начните смотреть YouTube вместе за 30 секунд</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Скачать бесплатно
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/guides/smotret-youtube-vmeste" />
    </>
  );
}
