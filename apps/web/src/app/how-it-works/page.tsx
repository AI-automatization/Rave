import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Как работает WeWatch — совместный просмотр видео за 4 шага',
  description:
    'Как смотреть видео вместе с друзьями через WeWatch: скачать приложение, открыть видео, создать комнату, поделиться ссылкой. Синхронизация iOS, Android и веб.',
  keywords: [
    'как работает watch party', 'как смотреть видео вместе', 'как создать комнату для просмотра',
    'как смотреть фильм с друзьями онлайн', 'watch party как пользоваться', 'wewatch инструкция',
  ],
  alternates: { canonical: 'https://wewatch.uz/how-it-works' },
  openGraph: {
    title: 'Как работает WeWatch',
    description: 'Совместный просмотр за 4 шага — синхронизация между всеми устройствами.',
    url: 'https://wewatch.uz/how-it-works',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const steps = [
  { n: 1, title: 'Скачайте приложение', desc: 'WeWatch бесплатен в App Store и Google Play. Регистрация занимает 30 секунд.' },
  { n: 2, title: 'Откройте любое видео', desc: 'Встроенный браузер открывает YouTube, VK Видео, Rutube и другие сайты. Найдите фильм, сериал или клип.' },
  { n: 3, title: 'Создайте комнату', desc: 'Нажмите «Создать комнату» — WeWatch выдаст ссылку-приглашение. Отправьте её друзьям в любом мессенджере.' },
  { n: 4, title: 'Смотрите синхронно', desc: 'Друг переходит по ссылке — и просмотр синхронизируется. Пауза, перемотка, скорость — всё применяется для всех сразу.' },
];

const howToLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Как смотреть видео вместе через WeWatch',
  description: 'Пошаговая инструкция по совместному онлайн-просмотру видео с друзьями.',
  totalTime: 'PT1M',
  step: steps.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.desc })),
};

export default function HowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Как это работает</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Как работает WeWatch</h1>
          <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
            Совместный просмотр видео с друзьями — за 4 шага. Один ставит паузу — у всех пауза. Работает между iPhone, Android и браузером одновременно.
          </p>

          <section className="mb-12">
            <ol className="space-y-6">
              {steps.map(({ n, title, desc }) => (
                <li key={n} className="flex gap-4">
                  <span className="flex-shrink-0 w-10 h-10 rounded-full bg-[#7B72F8] flex items-center justify-center text-base font-bold">{n}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
                    <p className="text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Как работает синхронизация</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              WeWatch держит одно и то же время воспроизведения у всех участников. Когда кто-то ставит паузу, перематывает или меняет скорость — команда мгновенно уходит остальным. Задержка синхронизации — менее 300 мс даже между разными устройствами и городами.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Работает без VPN. Если видео недоступно в регионе — это ограничение сайта-источника, а не WeWatch.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Частые вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Это бесплатно?', a: 'Да, полностью. Без ограничений по времени и количеству комнат.' },
                { q: 'Нужно ли гостю регистрироваться?', a: 'Создатель комнаты регистрируется, гость входит по ссылке-приглашению.' },
                { q: 'На чём работает?', a: 'iOS, Android и веб-браузер. Участники могут быть на разных платформах одновременно.' },
                { q: 'Какие сайты поддерживает?', a: 'YouTube, VK Видео, Rutube, прямые .mp4 ссылки и другие через встроенный браузер.' },
              ].map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Готовы попробовать?</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch и создайте первую комнату за минуту</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Начать бесплатно
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
