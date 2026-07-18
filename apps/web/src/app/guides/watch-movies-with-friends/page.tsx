import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaFilm } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Смотреть кино с друзьями онлайн бесплатно',
  description: 'Как смотреть фильмы и сериалы с друзьями онлайн одновременно — бесплатно, без регистрации партнёра, с iPhone, Android и компьютера. Пошаговый гайд WeWatch.',
  keywords: [
    'смотреть кино с друзьями онлайн', 'смотреть фильм вместе онлайн бесплатно',
    'смотреть сериал вместе онлайн', 'кино с другом бесплатно', 'онлайн кинотеатр с друзьями',
    'смотреть аниме вместе', 'смотреть кино вместе через интернет',
    "do'stlar bilan kino ko'rish", 'birga kino onlayn',
  ],
  alternates: { canonical: 'https://wewatch.uz/guides/kino-s-drugom-onlayn' },
  openGraph: {
    title: 'Смотреть кино с друзьями онлайн бесплатно | WeWatch',
    description: 'Бесплатный способ смотреть фильмы и сериалы вместе с друзьями через интернет — синхронно, с чатом, с любого устройства.',
    url: 'https://wewatch.uz/guides/kino-s-drugom-onlayn',
    type: 'article',
  },
  robots: { index: false, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Смотреть кино с друзьями онлайн бесплатно',
  description: 'Полный гайд по совместному просмотру фильмов и сериалов онлайн через WeWatch — бесплатно, без расширений, с любого устройства.',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-01',
  dateModified: '2026-06-14',
  url: 'https://wewatch.uz/guides/watch-movies-with-friends',
  mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://wewatch.uz/guides/watch-movies-with-friends' },
};

export default function WatchMoviesWithFriendsPage() {
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
              <Link href="/guides/what-is-watch-party" className="hover:text-zinc-300 transition-colors">Что такое watch party</Link>
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
              <span className="text-zinc-300">Кино с друзьями</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 flex items-center justify-center">
                <FaFilm size={18} className="text-[#7B72F8]" />
              </div>
              <span className="text-zinc-500 text-sm">Гайд · 4 минуты</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Смотреть кино с друзьями онлайн бесплатно
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Фильмы, сериалы, аниме — синхронно с друзьями, где бы они ни находились. С телефона, компьютера, без расширений.
            </p>
          </div>

          <div className="bg-[#111118] border border-[#7B72F8]/30 rounded-2xl px-6 py-5 mb-12">
            <p className="text-zinc-400 text-sm leading-6">
              <strong className="text-white">Коротко:</strong> WeWatch — бесплатное приложение для совместного просмотра. Вы создаёте комнату, вставляете ссылку на видео (YouTube, VK, Rutube), отправляете ссылку другу — и смотрите синхронно. Пауза работает для всех одновременно. Есть чат и реакции.
            </p>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Способы смотреть кино вместе онлайн</h2>

            <div className="space-y-6">
              <div className="bg-[#111118] border border-zinc-800/60 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-[#7B72F8] text-white text-xs font-bold px-2.5 py-1 rounded-lg">Лучший вариант</span>
                  <h3 className="text-white font-semibold">WeWatch — синхронный просмотр с приложением</h3>
                </div>
                <p className="text-zinc-400 text-sm leading-7 mb-3">
                  Специализированное приложение с настоящей синхронизацией. Пауза хозяина комнаты мгновенно передаётся всем участникам. Поддерживает YouTube, VK, Rutube. Работает между iPhone, Android и браузером одновременно. Есть чат и эмодзи реакции.
                </p>
                <p className="text-zinc-500 text-xs">✅ Бесплатно &nbsp;·&nbsp; ✅ Без расширений &nbsp;·&nbsp; ✅ iOS + Android + Web &nbsp;·&nbsp; ✅ До 10 человек</p>
              </div>

              <div className="bg-[#111118] border border-zinc-800/60 rounded-xl p-6 opacity-70">
                <h3 className="text-zinc-300 font-semibold mb-2">Discord + общий экран</h3>
                <p className="text-zinc-500 text-sm leading-7">
                  Можно транслировать экран через Discord. Но качество зависит от скорости интернета стримера, у зрителей всегда задержка 1-3 секунды, нет интерактивной паузы. Работает только на компьютере.
                </p>
                <p className="text-zinc-600 text-xs mt-2">⚠️ Задержка &nbsp;·&nbsp; ⚠️ Только компьютер &nbsp;·&nbsp; ⚠️ Нет паузы для всех</p>
              </div>

              <div className="bg-[#111118] border border-zinc-800/60 rounded-xl p-6 opacity-70">
                <h3 className="text-zinc-300 font-semibold mb-2">Teleparty (Netflix Party)</h3>
                <p className="text-zinc-500 text-sm leading-7">
                  Расширение для браузера, работает только с Netflix, Disney+, HBO. Требует платную подписку на стриминговый сервис у каждого участника. Нет мобильного приложения.
                </p>
                <p className="text-zinc-600 text-xs mt-2">⚠️ Только Netflix/Disney+ &nbsp;·&nbsp; ⚠️ Требует расширение &nbsp;·&nbsp; ⚠️ Нет мобайла</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Пошаговый гайд: WeWatch за 2 минуты</h2>
            <div className="space-y-6">
              {[
                {
                  n: 1,
                  title: 'Откройте WeWatch',
                  text: 'Установите приложение WeWatch из App Store (iOS) или откройте wewatch.uz в браузере на компьютере или Android.',
                },
                {
                  n: 2,
                  title: 'Найдите видео на YouTube или VK',
                  text: 'Откройте видео на YouTube, VK Видео или Rutube. Скопируйте ссылку из адресной строки браузера или из кнопки «Поделиться».',
                },
                {
                  n: 3,
                  title: 'Создайте комнату в WeWatch',
                  text: 'В WeWatch нажмите «Создать комнату», вставьте скопированную ссылку. Можно добавить название — например, «Вечер с Сашей».',
                },
                {
                  n: 4,
                  title: 'Отправьте ссылку на комнату другу',
                  text: 'Скопируйте ссылку на комнату и отправьте другу в Telegram, WhatsApp или Instagram. Другу не нужно скачивать приложение — он может зайти через браузер.',
                },
                {
                  n: 5,
                  title: 'Смотрите и общайтесь в чате',
                  text: 'Когда друг в комнате — нажимайте Play. Используйте встроенный чат и эмодзи реакции во время просмотра. Хозяин управляет воспроизведением для всех.',
                },
              ].map(({ n, title, text }) => (
                <div key={n} className="flex gap-4">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-[#7B72F8] flex items-center justify-center text-white font-bold text-sm">{n}</div>
                  <div className="pt-1">
                    <h3 className="text-white font-semibold mb-1">{title}</h3>
                    <p className="text-zinc-400 text-sm leading-7">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">Что смотреть вместе: идеи</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { emoji: '🎬', title: 'Фильмы на YouTube', desc: 'Тысячи легальных фильмов доступны бесплатно на YouTube. Ищите по жанру + "полный фильм".' },
                { emoji: '📺', title: 'Сериалы на VK', desc: 'ВКонтакте имеет огромную легальную библиотеку сериалов, в том числе русских.' },
                { emoji: '⚡', title: 'Аниме на YouTube', desc: 'Множество аниме-студий публикуют серии официально на YouTube с субтитрами.' },
                { emoji: '🎭', title: 'Стендап на YouTube', desc: 'Концерты и стендап-шоу — отличный вариант для вечера с друзьями онлайн.' },
                { emoji: '🎮', title: 'Геймплейные ролики', desc: 'Летсплеи и обзоры игр — смотрите обсуждая любимые игры в реальном времени.' },
                { emoji: '📚', title: 'Документалки', desc: 'Документальные фильмы о природе, истории, технологиях — для совместного изучения.' },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="bg-[#111118] border border-zinc-800/60 rounded-xl p-4 flex gap-3">
                  <span className="text-2xl shrink-0">{emoji}</span>
                  <div>
                    <p className="text-white font-medium text-sm mb-0.5">{title}</p>
                    <p className="text-zinc-500 text-xs leading-5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Частые вопросы</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Нужно ли другу скачивать приложение?',
                  a: 'Нет. Другу достаточно перейти по ссылке на комнату через браузер на любом устройстве. Приложение нужно только если хочешь создавать комнаты с мобильного.',
                },
                {
                  q: 'Работает ли WeWatch для просмотра аниме?',
                  a: 'Да. Большинство аниме доступно на YouTube (официальные каналы студий), VK или по прямым ссылкам — все эти источники WeWatch поддерживает.',
                },
                {
                  q: 'Можно смотреть с человеком в другой стране?',
                  a: 'Да, WeWatch работает везде где есть интернет. Синхронизация происходит через наш сервер, поэтому расстояние и разные часовые пояса не мешают.',
                },
                {
                  q: "Do'stlarim bilan kino ko'rish uchun nima kerak?",
                  a: "WeWatch ilovasini App Store'dan yuklab oling yoki wewatch.uz saytini oching. Xona yarating, havolani do'stingizga yuboring — tayyor. Sinxronizatsiya avtomatik ishlaydi.",
                },
              ].map(({ q, a }) => (
                <div key={q} className="border-b border-zinc-800/60 pb-6">
                  <h3 className="text-white font-semibold mb-2">{q}</h3>
                  <p className="text-zinc-400 text-sm leading-7">{a}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-br from-[#7B72F8]/10 to-[#7B72F8]/5 border border-[#7B72F8]/25 rounded-2xl px-8 py-8 text-center">
            <p className="text-zinc-400 text-sm mb-2">Готовы?</p>
            <p className="text-white font-bold text-2xl mb-1">Создайте комнату и зовите друзей</p>
            <p className="text-zinc-500 text-sm mb-6">Бесплатно · Без расширений · iOS, Android, Web</p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              <FaPlay size={12} />
              Начать смотреть вместе
            </Link>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800/40">
            <p className="text-zinc-600 text-sm mb-4">Читайте также:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/guides/watch-youtube-together" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Смотреть YouTube вместе →
              </Link>
              <Link href="/guides/what-is-watch-party" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Что такое watch party →
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
