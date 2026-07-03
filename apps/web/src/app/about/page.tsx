import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'О WeWatch — бесплатное приложение для совместного просмотра видео',
  description: 'WeWatch — бесплатное приложение для совместного просмотра YouTube, VK и Rutube с друзьями онлайн. iOS и Android. Основано в Узбекистане в 2025 году.',
  alternates: { canonical: 'https://wewatch.uz/about' },
  openGraph: {
    title: 'О WeWatch',
    description: 'WeWatch — бесплатный watch party для iOS и Android. Смотри видео синхронно с друзьями.',
    url: 'https://wewatch.uz/about',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://wewatch.uz/#organization',
  name: 'WeWatch',
  alternateName: ['wewatch', 'wewatch.uz', 'WeWatch app'],
  url: 'https://wewatch.uz',
  logo: {
    '@type': 'ImageObject',
    url: 'https://wewatch.uz/icons/icon-512x512.png',
    width: 512,
    height: 512,
  },
  description: 'WeWatch — бесплатное мобильное приложение для совместного просмотра видео онлайн. Позволяет смотреть YouTube, VK Видео, Rutube и другие сайты синхронно с друзьями в реальном времени через iOS и Android.',
  foundingDate: '2025',
  areaServed: ['RU', 'UZ', 'KZ', 'BY'],
  knowsAbout: ['watch party', 'video sync', 'social viewing', 'co-watching'],
  sameAs: [
    'https://apps.apple.com/app/wewatch',
    'https://play.google.com/store/apps/details?id=uz.wewatch',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'support@wewatch.uz',
  },
};

const STATS = [
  { label: 'Платформы', value: 'iOS + Android' },
  { label: 'Стоимость', value: 'Бесплатно' },
  { label: 'Основано', value: '2025, Узбекистан' },
  { label: 'Поддерживаемых сайтов', value: 'Любые' },
];

export default function AboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>О приложении</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            О WeWatch
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch — бесплатное мобильное приложение для совместного просмотра видео онлайн. Позволяет смотреть YouTube, VK Видео, Rutube и любые другие сайты синхронно с друзьями — в реальном времени, с чатом и реакциями.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
            {STATS.map(({ label, value }) => (
              <div key={label} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 text-center">
                <div className="text-[#7B72F8] font-bold text-lg mb-1">{value}</div>
                <div className="text-zinc-500 text-xs">{label}</div>
              </div>
            ))}
          </div>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Что такое WeWatch?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              WeWatch — это watch party приложение для iOS и Android. Пользователь открывает встроенный браузер, находит любое видео (YouTube, VK, Rutube, Uzmove и другие), создаёт комнату и приглашает друзей по ссылке.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Все участники видят один и тот же кадр в реальном времени. Когда один ставит паузу — пауза встаёт у всех. Перемотка тоже синхронизируется мгновенно.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Уникальная особенность WeWatch — кросс-платформенность. Один участник может быть на iPhone, другой на Android, третий в браузере на ноутбуке — синхронизация работает для всех одновременно.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Возможности</h2>
            <ul className="space-y-3 text-zinc-400">
              {[
                { title: 'Синхронный просмотр', desc: 'Отставание менее 500 мс — практически незаметно' },
                { title: 'Встроенный браузер', desc: 'Любой видеосайт без ограничений — YouTube, VK, Rutube, Uzmove и другие' },
                { title: 'Кросс-платформа', desc: 'iOS + Android + браузер в одной комнате' },
                { title: 'Чат и реакции', desc: 'Обсуждайте видео прямо во время просмотра' },
                { title: 'Watch party за 30 секунд', desc: 'Создайте комнату, поделитесь ссылкой — всё готово' },
                { title: 'Бесплатно', desc: 'Без подписок, без скрытых платежей' },
              ].map(({ title, desc }) => (
                <li key={title} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7B72F8] flex-shrink-0 mt-2" />
                  <div>
                    <span className="text-white font-medium">{title}</span>
                    <span className="text-zinc-500"> — {desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Для кого WeWatch?</h2>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch создан для людей, которые хотят смотреть видео вместе с друзьями или близкими, но находятся на расстоянии. Студенты, пары в разных городах, друзья из разных стран — WeWatch делает совместный просмотр простым и доступным для всех.
            </p>
          </section>

          <section className="mb-14">
            <h2 className="text-2xl font-bold text-white mb-4">Полезные гайды</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { href: '/guides/smotret-vmeste-onlayn', label: 'Как смотреть вместе онлайн' },
                { href: '/guides/smotret-youtube-vmeste', label: 'Смотреть YouTube вместе' },
                { href: '/guides/smotret-anime-vmeste', label: 'Смотреть аниме вместе' },
                { href: '/guides/kino-s-drugom-onlayn', label: 'Кино с другом онлайн' },
                { href: '/guides/smotret-serial-vmeste', label: 'Смотреть сериал вместе' },
                { href: '/guides/watch-party-besplatno', label: 'Watch party бесплатно' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center gap-2 p-3 rounded-xl border border-zinc-800 hover:border-[#7B72F8]/40 transition-colors text-zinc-300 hover:text-white text-sm">
                  <span className="text-[#7B72F8]">→</span> {label}
                </Link>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Попробуйте WeWatch бесплатно</h2>
            <p className="text-zinc-400 mb-6">iOS и Android — установка 30 секунд</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Скачать WeWatch
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
