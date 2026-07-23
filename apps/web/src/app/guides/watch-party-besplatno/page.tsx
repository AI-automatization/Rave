import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  title: 'Watch Party бесплатно — лучшее приложение 2026',
  description: 'Бесплатный Watch Party для iOS и Android. WeWatch — смотри YouTube, VK, Rutube синхронно с друзьями. Без подписки, без ограничений по времени.',
  keywords: ['watch party бесплатно', 'бесплатный watch party', 'watch party приложение бесплатно', 'watch party без регистрации', 'лучший watch party', 'watch party ios android'],
  alternates: { canonical: 'https://wewatch.uz/guides/watch-party-besplatno' },
  openGraph: {
    title: 'Watch Party бесплатно | WeWatch',
    description: 'Лучший бесплатный watch party для iOS и Android. YouTube, VK, Rutube синхронно с друзьями.',
    url: 'https://wewatch.uz/guides/watch-party-besplatno',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Watch Party бесплатно — как начать в 2026',
  description: 'Обзор бесплатных способов устроить watch party через WeWatch',
  author: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz' },
  datePublished: '2026-06-15',
  inLanguage: 'ru',
  mainEntityOfPage: 'https://wewatch.uz/guides/watch-party-besplatno',
};

const COMPARE = [
  { name: 'WeWatch', free: true, mobile: true, anysite: true, crossplatform: true },
  { name: 'Teleparty', free: false, mobile: false, anysite: false, crossplatform: false },
  { name: 'Discord Screen Share', free: true, mobile: true, anysite: true, crossplatform: false },
  { name: 'Amazon Watch Party', free: false, mobile: false, anysite: false, crossplatform: false },
];

const RELATED = [
  { href: '/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/guides/what-is-watch-party', label: 'Что такое Watch Party' },
  { href: '/guides/smotret-youtube-vmeste', label: 'YouTube вместе' },
];

export default function WatchPartyBesplatnoPage() {
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
            <span>Watch Party бесплатно</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Watch Party бесплатно в 2026
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            WeWatch — единственный полностью бесплатный watch party для мобильных устройств, который работает с любым видеосайтом. Без подписки, без ограничений по времени, без привязки к одной платформе.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Сравнение бесплатных Watch Party сервисов</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-zinc-400 border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 text-white font-semibold">Сервис</th>
                    <th className="text-center py-3 text-white font-semibold">Бесплатно</th>
                    <th className="text-center py-3 text-white font-semibold">Мобильный</th>
                    <th className="text-center py-3 text-white font-semibold">Любой сайт</th>
                    <th className="text-center py-3 text-white font-semibold">Кросс-платформа</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARE.map(({ name, free, mobile, anysite, crossplatform }) => (
                    <tr key={name} className={`border-b border-zinc-900 ${name === 'WeWatch' ? 'bg-[#7B72F8]/5' : ''}`}>
                      <td className={`py-3 font-medium ${name === 'WeWatch' ? 'text-[#7B72F8]' : 'text-white'}`}>{name}</td>
                      <td className="text-center py-3">{free ? '✅' : '❌'}</td>
                      <td className="text-center py-3">{mobile ? '✅' : '❌'}</td>
                      <td className="text-center py-3">{anysite ? '✅' : '❌'}</td>
                      <td className="text-center py-3">{crossplatform ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Почему WeWatch лучший бесплатный вариант</h2>
            <ul className="space-y-3 text-zinc-400 text-sm">
              {[
                '✅ Полностью бесплатный — без скрытых платежей',
                '✅ Работает с YouTube, VK, Rutube, Uzmove и любым сайтом',
                '✅ iOS + Android + браузер одновременно',
                '✅ Нет ограничений по количеству участников или времени',
                '✅ Встроенный чат и эмодзи-реакции',
                '✅ Синхронизация < 500 мс',
              ].map(i => <li key={i}>{i}</li>)}
            </ul>
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
            <h2 className="text-2xl font-bold text-white mb-3">Начните Watch Party бесплатно</h2>
            <p className="text-zinc-400 mb-6">Скачайте WeWatch — лучший бесплатный watch party для iOS и Android</p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Скачать бесплатно
            </Link>
          </div>
        </div>
      </main>
      <GuideFooter locale="ru" currentPath="/guides/watch-party-besplatno" />
    </>
  );
}
