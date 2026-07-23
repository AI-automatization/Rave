import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  // No manual "| WeWatch" — the root layout's title template appends it.
  title: 'Смотреть Rutube вместе с друзьями онлайн — синхронно',
  description:
    'Как смотреть Rutube вместе с друзьями синхронно. WeWatch открывает Rutube во встроенном браузере и держит просмотр синхронно между iPhone, Android и вебом.',
  keywords: [
    'смотреть rutube вместе', 'рутьюб вместе с друзьями', 'смотреть rutube синхронно',
    'watch party rutube', 'совместный просмотр rutube', 'смотреть видео rutube вместе онлайн',
  ],
  alternates: { canonical: 'https://wewatch.uz/guides/smotret-rutube-vmeste' },
  openGraph: {
    title: 'Смотреть Rutube вместе | WeWatch',
    description: 'Синхронный просмотр Rutube с друзьями — на любом устройстве.',
    url: 'https://wewatch.uz/guides/smotret-rutube-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть Rutube вместе с друзьями',
  description: 'Гайд по совместному синхронному просмотру Rutube через WeWatch.',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-07-02',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/smotret-rutube-vmeste',
};

export default function RutubeVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="ru" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Rutube вместе</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Смотреть Rutube вместе с друзьями</h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch открывает Rutube во встроенном браузере и синхронизирует просмотр для всех участников. Один ставит паузу — у всех пауза. Работает на iPhone, Android и в вебе.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Как смотреть Rutube вместе — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Откройте WeWatch', desc: 'Скачайте приложение бесплатно в App Store или Google Play.' },
                { n: 2, title: 'Найдите видео на Rutube', desc: 'В браузере WeWatch откройте Rutube и выберите фильм, сериал или ролик.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите «Создать комнату» и отправьте ссылку-приглашение друзьям.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'WeWatch извлекает поток Rutube и держит его синхронно у всех.' },
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
            <h2 className="text-2xl font-bold mb-4">Rutube без рассинхрона</h2>
            <p className="text-zinc-400 leading-relaxed">
              Rutube по-разному грузится у разных людей, поэтому «включим одновременно» не работает. WeWatch держит единое время воспроизведения и компенсирует буферизацию — вы видите один кадр одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Работает с фильмами Rutube?', a: 'Да, WeWatch открывает любые видео Rutube через встроенный браузер.' },
                { q: 'Нужен ли VPN?', a: 'Нет. WeWatch работает напрямую.' },
                { q: 'Это бесплатно?', a: 'Да, WeWatch бесплатен.' },
              ].map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Смотрите Rutube вместе</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch бесплатно</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">Скачать WeWatch</Link>
              <Link href="/guides/smotret-vk-video-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">VK Видео вместе →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/guides/smotret-rutube-vmeste" />
    </>
  );
}
