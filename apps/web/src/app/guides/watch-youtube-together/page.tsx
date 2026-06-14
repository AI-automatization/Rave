import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay, FaYoutube } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Как смотреть YouTube вместе с другом онлайн бесплатно | WeWatch',
  description: 'Пошаговая инструкция: как смотреть YouTube вместе с друзьями онлайн синхронно. Работает с iPhone, Android, компьютером — бесплатно и без расширений.',
  keywords: [
    'смотреть youtube вместе', 'как смотреть youtube с другом онлайн', 'смотреть ютуб вместе',
    'youtube watch party', 'watch youtube together online free', 'ютуб совместный просмотр',
    'смотреть ютуб с другом', 'youtube вместе онлайн бесплатно', 'синхронный просмотр youtube',
  ],
  alternates: { canonical: 'https://wewatch.uz/guides/watch-youtube-together' },
  openGraph: {
    title: 'Как смотреть YouTube вместе с другом онлайн бесплатно | WeWatch',
    description: 'Пошаговый гайд: смотрите YouTube синхронно с друзьями — с телефона, с компьютера, между платформами. Без расширений, бесплатно.',
    url: 'https://wewatch.uz/guides/watch-youtube-together',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Как смотреть YouTube вместе с другом онлайн',
  description: 'Пошаговая инструкция по созданию совместного просмотра YouTube через WeWatch',
  totalTime: 'PT2M',
  tool: [{ '@type': 'HowToTool', name: 'WeWatch' }],
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Скачайте WeWatch или откройте сайт', text: 'Установите приложение WeWatch из App Store или откройте wewatch.uz в браузере.' },
    { '@type': 'HowToStep', position: 2, name: 'Войдите или зарегистрируйтесь', text: 'Создайте бесплатный аккаунт или войдите в существующий.' },
    { '@type': 'HowToStep', position: 3, name: 'Создайте комнату', text: 'Нажмите «Создать комнату» и вставьте ссылку на YouTube-видео.' },
    { '@type': 'HowToStep', position: 4, name: 'Поделитесь ссылкой', text: 'Скопируйте ссылку на комнату и отправьте другу в мессенджере.' },
    { '@type': 'HowToStep', position: 5, name: 'Смотрите вместе', text: 'Когда друг заходит — нажимайте Play и смотрите синхронно. Пауза работает для всех.' },
  ],
};

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-9 h-9 rounded-full bg-[#7B72F8] flex items-center justify-center text-white font-bold text-sm">{n}</div>
      <div className="pt-1">
        <h3 className="text-white font-semibold mb-1">{title}</h3>
        <p className="text-zinc-400 text-sm leading-7">{text}</p>
      </div>
    </div>
  );
}

export default function WatchYouTubeTogetherPage() {
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
              <span className="text-zinc-300">YouTube вместе</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center">
                <FaYoutube size={20} className="text-red-500" />
              </div>
              <span className="text-zinc-500 text-sm">Гайд · 3 минуты на чтение</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Как смотреть YouTube вместе с другом онлайн
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
              Бесплатно, без расширений для браузера, с любого устройства — iPhone, Android или компьютер. Синхронизация автоматическая.
            </p>
          </div>

          <div className="bg-[#111118] border border-[#7B72F8]/30 rounded-2xl px-6 py-5 mb-12">
            <p className="text-zinc-400 text-sm leading-6">
              <strong className="text-white">Кратко:</strong> WeWatch синхронизирует YouTube-видео между участниками комнаты в реальном времени. Паузите — все паузят. Перематываете — все перематывают. Работает между iPhone, Android и браузером на компьютере одновременно.
            </p>
          </div>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-8">Пошаговая инструкция</h2>
            <div className="space-y-8">
              <Step n={1} title="Скачайте WeWatch или откройте сайт"
                text="Для iPhone — установите WeWatch из App Store. Для компьютера или Android — откройте wewatch.uz в любом браузере. Регистрация занимает 30 секунд." />
              <Step n={2} title="Создайте комнату"
                text="После входа нажмите кнопку «Создать комнату». Откроется форма — вставьте туда ссылку на YouTube-видео (например, https://youtube.com/watch?v=...). Можно добавить название комнаты." />
              <Step n={3} title="Поделитесь ссылкой с другом"
                text="Скопируйте ссылку на вашу комнату и отправьте другу в WhatsApp, Telegram или любом мессенджере. Другу достаточно нажать на ссылку — он сразу попадёт в комнату." />
              <Step n={4} title="Нажмите Play — и смотрите вместе"
                text="Когда все в комнате — нажмите воспроизведение. Все участники видят видео синхронно. Хозяин комнаты управляет воспроизведением: его пауза и перемотка работают для всех сразу." />
            </div>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Работает между разными устройствами</h2>
            <p className="text-zinc-400 leading-7 mb-4">
              Одна из главных особенностей WeWatch — кросс-платформенность. Вы можете быть в одной комнате:
            </p>
            <ul className="space-y-3 mb-6">
              {[
                'iPhone + компьютер в браузере',
                'Android + iPhone',
                'Компьютер + телефон любой платформы',
                'Несколько компьютеров в разных странах',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-[#7B72F8] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-zinc-400 leading-7">
              Синхронизация работает через WebSocket-соединение с сервером. Задержка между командой хозяина и реакцией у участников — менее 100 миллисекунд.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-6">Часто задаваемые вопросы</h2>
            <div className="space-y-6">
              {[
                {
                  q: 'Нужно ли скачивать расширение для браузера?',
                  a: 'Нет. WeWatch работает как веб-приложение — просто откройте wewatch.uz. Никаких расширений не нужно.',
                },
                {
                  q: 'Можно ли смотреть YouTube вместе бесплатно?',
                  a: 'Да, базовый план WeWatch полностью бесплатен. Создавайте комнаты и смотрите YouTube вместе без ограничений по времени.',
                },
                {
                  q: 'Друг видит рекламу на YouTube?',
                  a: 'Да, каждый видит YouTube через свой браузер или приложение, включая рекламу. WeWatch только синхронизирует воспроизведение — контент доставляется напрямую от YouTube.',
                },
                {
                  q: 'Работает ли с YouTube Shorts и прямыми эфирами?',
                  a: 'YouTube Shorts поддерживаются полностью. Для прямых эфиров синхронизация работает, но задержки самого стрима могут различаться у разных участников.',
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
            <p className="text-zinc-400 text-sm mb-2">Готовы попробовать?</p>
            <p className="text-white font-bold text-2xl mb-4">Создайте комнату за 30 секунд</p>
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
              <Link href="/guides/what-is-watch-party" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Что такое watch party →
              </Link>
              <Link href="/guides/watch-movies-with-friends" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Смотреть кино с друзьями →
              </Link>
              <Link href="/faq" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Все вопросы и ответы →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
