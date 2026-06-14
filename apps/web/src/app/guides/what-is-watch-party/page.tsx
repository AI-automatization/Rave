import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaUsers } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Что такое Watch Party — совместный просмотр видео онлайн | WeWatch',
  description: 'Watch party — это синхронный совместный просмотр видео с друзьями в интернете. Объясняем как это работает, чем отличается от обычного просмотра и как начать.',
  keywords: [
    'что такое watch party', 'watch party что это', 'совместный просмотр видео онлайн',
    'watch party приложение', 'синхронный просмотр', 'онлайн кинотеатр с друзьями',
    'смотреть кино вместе онлайн', 'watch party как работает',
  ],
  alternates: { canonical: 'https://wewatch.uz/guides/what-is-watch-party' },
  openGraph: {
    title: 'Что такое Watch Party | WeWatch',
    description: 'Полное объяснение watch party: как работает синхронный просмотр видео с друзьями через интернет, какие платформы поддерживаются и как начать.',
    url: 'https://wewatch.uz/guides/what-is-watch-party',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Что такое watch party — совместный просмотр видео онлайн',
  description: 'Полное руководство по совместному просмотру видео в интернете: что такое watch party, как работает синхронизация и как начать смотреть вместе с друзьями.',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-01',
  dateModified: '2026-06-14',
  url: 'https://wewatch.uz/guides/what-is-watch-party',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://wewatch.uz/guides/what-is-watch-party' },
};

export default function WhatIsWatchPartyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-[#0A0A0F] text-zinc-300">
        <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-zinc-800/60">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#7B72F8] flex items-center justify-center">
                <FaPlay size={9} className="text-white ml-0.5" />
              </div>
              <span className="text-xl font-bold tracking-wider text-white">
                WE<span className="text-[#7B72F8]">WATCH</span>
              </span>
            </Link>
            <div className="flex gap-4 text-sm text-zinc-500">
              <Link href="/faq" className="hover:text-zinc-300 transition-colors">FAQ</Link>
              <Link href="/guides/watch-youtube-together" className="hover:text-zinc-300 transition-colors">YouTube вместе</Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="mb-10">
            <div className="flex items-center gap-2 text-zinc-500 text-sm mb-4">
              <Link href="/" className="hover:text-zinc-300 transition-colors">Главная</Link>
              <span>/</span>
              <span>Гайды</span>
              <span>/</span>
              <span className="text-zinc-300">Что такое watch party</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <FaUsers size={18} className="text-[#7B72F8]" />
              </div>
              <span className="text-zinc-500 text-sm">Объяснение · 4 минуты</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Что такое watch party
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Совместный просмотр видео через интернет — объясняем как это работает и чем отличается от обычной трансляции.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Простое определение</h2>
            <p className="text-zinc-400 leading-8 mb-4">
              <strong className="text-white">Watch party</strong> (в переводе с английского — «вечеринка просмотра») — это синхронный совместный просмотр видео несколькими людьми через интернет в режиме реального времени. Участники находятся в разных местах, но видят одно и то же видео в одну и ту же секунду.
            </p>
            <p className="text-zinc-400 leading-8">
              Это как смотреть фильм с другом на одном диване — только друг может быть в другом городе или другой стране. Вы паузите — у него тоже пауза. Он перематывает — у вас тоже. Всё синхронно.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Как это работает технически</h2>
            <p className="text-zinc-400 leading-8 mb-4">
              Watch party работает через специальный сервер, который получает команды от одного участника (обычно «хозяина» комнаты) и мгновенно передаёт их всем остальным.
            </p>
            <div className="grid gap-4 md:grid-cols-3 my-6">
              {[
                { title: 'Хозяин нажимает Play', desc: 'Команда уходит на сервер за ~10мс' },
                { title: 'Сервер рассылает', desc: 'Все участники получают сигнал одновременно' },
                { title: 'Видео запускается', desc: 'Синхронно у всех с поправкой на сетевую задержку' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-[#111118] border border-zinc-800/60 rounded-xl p-5">
                  <p className="text-white font-semibold mb-1 text-sm">{title}</p>
                  <p className="text-zinc-500 text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-zinc-400 leading-8">
              WeWatch использует WebSocket-соединение через Socket.io — это протокол постоянного соединения между браузером и сервером. Задержка между командой и реакцией у участников — менее 100 миллисекунд, что незаметно для глаза.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Что можно смотреть</h2>
            <p className="text-zinc-400 leading-8 mb-4">WeWatch поддерживает несколько платформ:</p>
            <ul className="space-y-3 mb-6">
              {[
                { platform: 'YouTube', desc: 'Все видео, Shorts, трансляции' },
                { platform: 'VK Видео', desc: 'Полная библиотека ВКонтакте' },
                { platform: 'Rutube', desc: 'Российская видеоплатформа' },
                { platform: 'Прямые .mp4 ссылки', desc: 'Любое видео по прямой ссылке' },
                { platform: 'Встроенный браузер (мобайл)', desc: 'Uzmove, Cinerama и другие сайты' },
              ].map(({ platform, desc }) => (
                <li key={platform} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[#7B72F8] shrink-0" />
                  <span className="text-zinc-400"><strong className="text-white">{platform}</strong> — {desc}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4">Чем WeWatch отличается от конкурентов</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 pr-6 text-zinc-400 font-medium">Функция</th>
                    <th className="text-center py-3 px-4 text-white font-semibold">WeWatch</th>
                    <th className="text-center py-3 px-4 text-zinc-500 font-medium">Watch2gether</th>
                    <th className="text-center py-3 px-4 text-zinc-500 font-medium">Teleparty</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Мобильное приложение (iOS)', '✅', '❌', '❌'],
                    ['Android приложение', '⏳ скоро', '❌', '❌'],
                    ['Без браузерного расширения', '✅', '✅', '❌'],
                    ['YouTube + VK + Rutube', '✅', 'только YT', 'только Netflix'],
                    ['Бесплатно', '✅', 'частично', '✅'],
                    ['Кросс-платформа (iOS+Web)', '✅', '❌', '❌'],
                  ].map(([feature, ww, w2g, tp]) => (
                    <tr key={feature as string} className="border-b border-zinc-800/40">
                      <td className="py-3 pr-6 text-zinc-400">{feature}</td>
                      <td className="py-3 px-4 text-center text-white font-medium">{ww}</td>
                      <td className="py-3 px-4 text-center text-zinc-500">{w2g}</td>
                      <td className="py-3 px-4 text-center text-zinc-500">{tp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-4">Для чего используют watch party</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { title: 'Фильмы с друзьями на расстоянии', desc: 'Пары в разных городах, друзья эмигрировавшие за рубеж — смотрят вечером кино как будто вместе.' },
                { title: 'Аниме-просмотры', desc: 'Фанаты аниме собираются в комнатах WeWatch и обсуждают серии в реальном времени в чате.' },
                { title: 'Совместный разбор видео', desc: 'Обучение, обзор проектов, разбор игровых моментов — смотрят одно видео и комментируют.' },
                { title: 'Сериалы с партнёром', desc: 'Самый популярный сценарий — смотреть сериал с любимым человеком в разных городах.' },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-[#111118] border border-zinc-800/60 rounded-xl p-5">
                  <h3 className="text-white font-semibold mb-2">{title}</h3>
                  <p className="text-zinc-500 text-sm leading-6">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-[#7B72F8]/10 to-[#7B72F8]/5 border border-[#7B72F8]/25 rounded-2xl px-8 py-8 text-center">
            <p className="text-zinc-400 text-sm mb-2">Попробуйте прямо сейчас</p>
            <p className="text-white font-bold text-2xl mb-4">Создайте свою первую watch party</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <FaPlay size={12} />
              Начать бесплатно
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800/40">
            <p className="text-zinc-600 text-sm mb-4">Читайте также:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/guides/watch-youtube-together" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Как смотреть YouTube вместе →
              </Link>
              <Link href="/guides/watch-movies-with-friends" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Смотреть кино с друзьями →
              </Link>
              <Link href="/faq" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                FAQ →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
