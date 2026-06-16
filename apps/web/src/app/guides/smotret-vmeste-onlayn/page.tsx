import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Смотреть вместе онлайн бесплатно — синхронный просмотр с друзьями | WeWatch',
  description: 'Смотрите фильмы и видео вместе онлайн бесплатно. WeWatch синхронизирует просмотр между iPhone, Android и компьютером — пауза у одного = пауза у всех.',
  keywords: [
    'смотреть вместе онлайн', 'смотреть вместе онлайн бесплатно', 'смотреть вместе',
    'совместный просмотр онлайн', 'синхронный просмотр', 'смотреть фильм вместе онлайн',
    'смотреть видео вместе', 'онлайн кинотеатр с друзьями', 'вместе онлайн',
  ],
  alternates: {
    canonical: 'https://wewatch.uz/guides/smotret-vmeste-onlayn',
    languages: {
      'ru': 'https://wewatch.uz/guides/smotret-vmeste-onlayn',
      'uz': 'https://wewatch.uz/uz/guides/birgalikda-tomosha-qilish',
    },
  },
  openGraph: {
    title: 'Смотреть вместе онлайн бесплатно | WeWatch',
    description: 'Синхронный просмотр фильмов и видео с друзьями онлайн. Работает на iPhone, Android и в браузере.',
    url: 'https://wewatch.uz/guides/smotret-vmeste-onlayn',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Как смотреть вместе онлайн бесплатно',
  description: 'Полный гайд по совместному онлайн-просмотру фильмов и видео через WeWatch',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-15',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/smotret-vmeste-onlayn',
};

export default function SmotretVmesteOnlaynPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Смотреть вместе онлайн</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Смотреть вместе онлайн бесплатно
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch позволяет смотреть фильмы, сериалы и видео вместе с друзьями онлайн — бесплатно, синхронно, без задержек. Один участник ставит паузу — все ставят паузу. Расстояние не важно.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Что такое совместный просмотр онлайн?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Совместный просмотр онлайн (watch party) — это синхронное воспроизведение видео для нескольких людей через интернет. Каждый участник видит один и тот же кадр в одно и то же время. Когда кто-то перематывает или ставит паузу — изменение применяется для всех.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch делает это просто: скачиваете приложение, открываете встроенный браузер, находите любое видео и создаёте комнату. Друзья переходят по ссылке-приглашению — и вы смотрите вместе, как будто сидите рядом.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть вместе онлайн — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Скачайте WeWatch', desc: 'Бесплатно в App Store (iOS) или Google Play (Android). Установка занимает 30 секунд.' },
                { n: 2, title: 'Откройте видео', desc: 'Перейдите в браузер WeWatch и найдите видео на YouTube, VK Видео, Rutube или любом другом сайте.' },
                { n: 3, title: 'Создайте комнату', desc: 'Нажмите "Создать комнату". WeWatch выдаст ссылку-приглашение — отправьте её друзьям в любом мессенджере.' },
                { n: 4, title: 'Смотрите синхронно', desc: 'Как только друг переходит по ссылке — просмотр синхронизируется автоматически. Пауза, перемотка — всё работает для всех одновременно.' },
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
            <h2 className="text-2xl font-bold text-white mb-4">Какие сайты поддерживаются?</h2>
            <p className="text-zinc-400 mb-4">WeWatch работает с любыми видеосайтами через встроенный браузер:</p>
            <ul className="grid grid-cols-2 gap-2 text-zinc-400 text-sm">
              {['YouTube', 'VK Видео', 'Rutube', 'Uzmove', 'Cinerama', 'Любой .mp4 URL'].map(s => (
                <li key={s} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7B72F8] flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Кросс-платформенный просмотр</h2>
            <p className="text-zinc-400 leading-relaxed">
              Уникальная особенность WeWatch: один участник может быть на iPhone, другой — на Android, третий — в браузере на компьютере. Синхронизация работает между всеми платформами одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {[
                { q: 'Это бесплатно?', a: 'Да, WeWatch полностью бесплатный. Нет ограничений по времени или количеству комнат.' },
                { q: 'Нужна ли регистрация для гостя?', a: 'Создатель комнаты проходит быструю регистрацию. Гость может войти по ссылке.' },
                { q: 'Сколько человек могут смотреть вместе?', a: 'Несколько участников одновременно — текущий лимит зависит от тарифа.' },
                { q: 'Работает ли без VPN?', a: 'Да, WeWatch работает без VPN. Если видео недоступно в вашем регионе — это ограничение самого сайта, не WeWatch.' },
              ].map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Готовы смотреть вместе?</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch бесплатно и начните через 30 секунд</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Скачать WeWatch
              </Link>
              <Link href="/guides/watch-youtube-together" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">
                Гайд: YouTube вместе →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
