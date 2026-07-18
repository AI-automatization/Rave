import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  title: 'Смотреть сериал вместе с другом онлайн бесплатно',
  description: 'Смотрите сериалы вместе с друзьями онлайн — синхронно, бесплатно через WeWatch. Пауза у одного = пауза у всех. iOS, Android и браузер.',
  keywords: ['смотреть сериал вместе', 'смотреть сериалы вместе онлайн', 'смотреть сериал с другом онлайн', 'сериалы вместе онлайн бесплатно', 'совместный просмотр сериалов'],
  alternates: {
    canonical: 'https://wewatch.uz/guides/smotret-serial-vmeste',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-serial-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/serial-birgalikda',
      'x-default': 'https://wewatch.uz/guides/smotret-serial-vmeste',
    },
  },
  openGraph: {
    title: 'Смотреть сериал вместе с другом | WeWatch',
    description: 'Синхронный просмотр сериалов с друзьями онлайн. Бесплатно, iOS и Android.',
    url: 'https://wewatch.uz/guides/smotret-serial-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть сериал вместе с другом онлайн',
  description: 'Гайд по совместному просмотру сериалов через WeWatch',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-15',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/smotret-serial-vmeste',
};

const RELATED = [
  { href: '/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/guides/smotret-anime-vmeste', label: 'Смотреть аниме вместе' },
  { href: '/guides/kino-s-drugom-onlayn', label: 'Кино с другом онлайн' },
];

export default function SmotretSerialVmestePage() {
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
            <span>Сериал вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть сериал вместе с другом онлайн
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Друг далеко, а новый сезон уже вышел? WeWatch позволяет смотреть сериалы вместе онлайн — синхронно, с чатом и реакциями. Обсуждайте каждую серию в реальном времени.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Идеально для марафона сериалов</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              WeWatch не ограничивает время сессии. Смотрите 1 серию или весь сезон подряд — синхронизация работает непрерывно. Встроенный чат позволяет обсуждать события не выходя из приложения.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[
                { title: 'Любой сайт', desc: 'YouTube, VK, Rutube и любые другие через браузер' },
                { title: 'Синхронно', desc: 'Пауза у одного — пауза у всех. Отставание < 500 мс' },
                { title: 'Чат внутри', desc: 'Обсуждайте серии прямо в WeWatch' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
                  <h3 className="text-white font-semibold mb-1">{title}</h3>
                  <p className="text-zinc-500 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как начать — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Скачайте WeWatch', desc: 'App Store или Google Play — бесплатно.' },
                { n: 2, title: 'Найдите сериал', desc: 'Откройте браузер WeWatch, перейдите на YouTube, VK или любой стриминг. Выберите серию.' },
                { n: 3, title: 'Создайте комнату и поделитесь ссылкой', desc: 'Одна кнопка — WeWatch создаёт комнату и даёт ссылку для друга.' },
                { n: 4, title: 'Смотрите и общайтесь', desc: 'Пишите в чат прямо во время просмотра — WeWatch не мешает видео.' },
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
                { q: 'Если один отстаёт — что происходит?', a: 'WeWatch автоматически синхронизирует всех к позиции хоста. Никто не пропустит важный момент.' },
                { q: 'Можно ли смотреть сериалы с субтитрами?', a: 'Да. Субтитры работают на сайте как обычно — каждый выбирает язык сам.' },
                { q: 'Нужно ли оба иметь аккаунт?', a: 'Создателю комнаты нужен аккаунт WeWatch. Гость может войти по ссылке.' },
                { q: 'Работает ли если мы в разных странах?', a: 'Да. WeWatch работает через интернет — расстояние и страна не важны.' },
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
            <h2 className="text-2xl font-bold text-white mb-3">Смотрите сериалы вместе</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch бесплатно и начните марафон с другом</p>
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
