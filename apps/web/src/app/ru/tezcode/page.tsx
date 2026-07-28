import type { Metadata } from 'next';
import Link from 'next/link';

const TEZCODE_URL = 'https://tezcode.dev';

export const metadata: Metadata = {
  title: 'tezcode — AI Software Factory из Ташкента, создатель WeWatch',
  description:
    'WeWatch — продукт tezcode, AI-first студии разработки из Ташкента. tezcode создаёт продукты и AI-автоматизацию для бизнеса: WeWatch, RAOS, AI Office, HamshiraGo.',
  keywords: [
    'tezcode', 'tezcode.dev', 'тезкод', 'AI software factory Ташкент',
    'разработка приложений Ташкент', 'AI студия Узбекистан', 'создатель WeWatch',
    'tezcode wewatch', 'AI-first студия',
  ],
  alternates: { canonical: 'https://wewatch.uz/ru/tezcode' },
  openGraph: {
    title: 'tezcode — студия, создавшая WeWatch',
    description: 'AI-first студия разработки из Ташкента. Продукты: WeWatch, RAOS, AI Office, HamshiraGo.',
    url: 'https://wewatch.uz/ru/tezcode',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

// Entity linkage: declares WeWatch as a product of the Tezcode organization and
// cross-links to tezcode.dev via sameAs/url so Google associates the two brands.
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'tezcode',
  alternateName: ['TezCode', 'Tezcode AI Software Factory'],
  url: TEZCODE_URL,
  sameAs: [TEZCODE_URL, 'https://wewatch.uz'],
  description: 'AI-first студия разработки из Ташкента. Создаёт цифровые продукты и AI-автоматизацию для бизнеса.',
  address: { '@type': 'PostalAddress', addressLocality: 'Tashkent', addressCountry: 'UZ' },
  subOrganization: [
    { '@type': 'Organization', name: 'WeWatch', url: 'https://wewatch.uz', description: 'Совместный просмотр видео с друзьями онлайн' },
  ],
  makesOffer: {
    '@type': 'OfferCatalog',
    name: 'Продукты tezcode',
    itemListElement: [
      { '@type': 'SoftwareApplication', name: 'WeWatch', applicationCategory: 'EntertainmentApplication', url: 'https://wewatch.uz' },
      { '@type': 'SoftwareApplication', name: 'HamshiraGo', applicationCategory: 'HealthApplication' },
      { '@type': 'SoftwareApplication', name: 'AI Office', applicationCategory: 'BusinessApplication' },
      { '@type': 'SoftwareApplication', name: 'RAOS', applicationCategory: 'BusinessApplication' },
    ],
  },
};

const products = [
  { name: 'WeWatch', tag: 'Наш продукт', desc: 'Совместный просмотр видео с друзьями онлайн — YouTube, VK, Rutube синхронно.', href: '/ru' },
  { name: 'HamshiraGo', tag: 'Медицина', desc: 'Медицинская платформа — Production Beta.', href: TEZCODE_URL },
  { name: 'AI Office', tag: 'AI-платформа', desc: 'AI-инструменты для офиса и бизнес-процессов.', href: TEZCODE_URL },
  { name: 'RAOS', tag: 'Бизнес', desc: 'Аналитика и автоматизация для бизнеса.', href: TEZCODE_URL },
];

export default function TezcodePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>tezcode</span>
          </nav>

          <p className="text-sm font-semibold tracking-widest text-[#7B72F8] uppercase mb-4">AI Software Factory · Ташкент</p>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            WeWatch создан в&nbsp;<span className="text-[#7B72F8]">tezcode</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl">
            tezcode — AI-first студия разработки из Ташкента. Мы создаём цифровые продукты и AI-автоматизацию для бизнеса. WeWatch — один из наших продуктов.
          </p>

          <div className="mb-12">
            <a
              href={TEZCODE_URL}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Перейти на tezcode.dev →
            </a>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Продукты tezcode</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {products.map((p) => (
                <a
                  key={p.name}
                  href={p.href}
                  target={p.href.startsWith('http') ? '_blank' : undefined}
                  rel={p.href.startsWith('http') ? 'noopener' : undefined}
                  className="block border border-zinc-800 hover:border-[#7B72F8]/50 rounded-2xl p-6 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                    <span className="text-xs text-[#7B72F8] bg-[#7B72F8]/10 px-2 py-1 rounded-full">{p.tag}</span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed">{p.desc}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Кто такие tezcode</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              tezcode — команда разработчиков и AI-инженеров из Ташкента, Узбекистан. Мы строим продукты «под ключ»: от мобильных приложений и веб-сервисов до AI-автоматизации бизнес-процессов. WeWatch — пример нашего подхода: real-time синхронизация между iOS, Android и вебом.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Больше о компании и других продуктах — на <a href={TEZCODE_URL} target="_blank" rel="noopener" className="text-[#7B72F8] hover:underline">tezcode.dev</a>.
            </p>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Попробуйте WeWatch</h2>
            <p className="text-zinc-400 mb-6">Продукт tezcode для совместного просмотра — бесплатно</p>
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
              Открыть WeWatch
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
