import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/guides/kino-s-drugom-onlayn';

export const metadata: Metadata = {
  title: 'Смотреть кино с другом онлайн бесплатно',
  description: 'Смотрите фильмы и кино с другом онлайн бесплатно через WeWatch. Синхронный просмотр на iPhone, Android и компьютере. Расстояние не важно.',
  keywords: ['кино с другом онлайн', 'смотреть кино с другом', 'смотреть фильм с другом онлайн бесплатно', 'кино с другом бесплатно', 'смотреть кино вместе онлайн', 'фильм с другом онлайн'],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Кино с другом онлайн бесплатно | WeWatch',
    description: 'Синхронный просмотр фильмов с другом онлайн. Бесплатно, iOS и Android.',
    url: 'https://wewatch.uz/guides/kino-s-drugom-onlayn',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть кино с другом онлайн бесплатно',
  description: 'Гайд по совместному просмотру фильмов с другом через WeWatch',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-15',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/kino-s-drugom-onlayn',
};

const RELATED = [
  { href: '/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/en/guides/watch-movies-with-friends', label: 'English' },
  { href: '/guides/smotret-serial-vmeste', label: 'Смотреть сериал вместе' },
  { href: '/uz/guides/kino-birgalikda', label: "O'zbekcha" },
];

export default function KinoSDrugoOnlaynPage() {
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
            <span>Кино с другом онлайн</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть кино с другом онлайн бесплатно
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Хочешь провести вечер с другом за фильмом, но вы в разных городах? WeWatch решает это — синхронный просмотр кино онлайн, бесплатно, на любом устройстве. Как будто сидите рядом.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Что делает WeWatch особенным</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Большинство сервисов watch party привязаны к одной платформе (только Netflix или только YouTube). WeWatch открывает <strong className="text-white">любой видеосайт</strong> через встроенный браузер — смотри кино откуда угодно.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Плюс кросс-платформа: ты на iPhone, друг на Android или ноутбуке — синхронизация работает между всеми устройствами одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть кино с другом — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Скачайте WeWatch', desc: 'Бесплатно в App Store (iPhone) или Google Play (Android).' },
                { n: 2, title: 'Найдите фильм', desc: 'Откройте встроенный браузер, перейдите на любой видеосайт — YouTube, VK, Rutube, Uzmove или любой другой.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите "Создать комнату" и отправьте другу ссылку-приглашение.' },
                { n: 4, title: 'Смотрите вместе', desc: 'Друг переходит по ссылке — просмотр синхронизируется. Пишите в чат, ставьте эмодзи, обсуждайте каждую сцену.' },
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
                { q: 'Можно смотреть кино если мы в разных странах?', a: 'Да. WeWatch работает через интернет, расстояние не имеет значения. Узбекистан, Россия, Европа — синхронизация одинаковая.' },
                { q: 'Нужна ли подписка на видеосервис?', a: 'Зависит от сайта. WeWatch открывает видео в браузере — если сайт требует подписку, она нужна. Но YouTube и VK работают бесплатно.' },
                { q: 'Можно ли смотреть с нескольких друзей одновременно?', a: 'Да — создайте одну комнату и поделитесь ссылкой с несколькими людьми. Все смотрят синхронно.' },
                { q: 'Это действительно бесплатно?', a: 'Да. WeWatch бесплатный. Скачайте приложение и начните сегодня.' },
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
            <h2 className="text-2xl font-bold text-white mb-3">Кино с другом — прямо сейчас</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch бесплатно и начните за 30 секунд</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Скачать бесплатно
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/guides/kino-s-drugom-onlayn" />
    </>
  );
}
