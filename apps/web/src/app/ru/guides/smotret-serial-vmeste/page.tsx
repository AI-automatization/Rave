import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideSteps, GuideFAQ, GuideCTA } from '@/components/common/GuideArticleUI';

export const metadata: Metadata = {
  title: 'Смотреть сериал с другом онлайн — синхронный марафон',
  description: 'Как смотреть один сериал с другом по эпизодам: синхронное воспроизведение, пауза и чат в веб-версии WeWatch.',
  keywords: ['смотреть сериал с другом', 'смотреть сериал вместе с другом', 'синхронный просмотр сериала', 'сериальный марафон с другом'],
  alternates: {
    canonical: 'https://wewatch.uz/ru/guides/smotret-serial-vmeste',
    languages: {
      'ru': 'https://wewatch.uz/ru/guides/smotret-serial-vmeste',
      'uz': 'https://wewatch.uz/uz/guides/serial-birgalikda',
      'x-default': 'https://wewatch.uz/ru/guides/smotret-serial-vmeste',
    },
  },
  openGraph: {
    title: 'Смотреть сериал вместе с другом | WeWatch',
    description: 'Синхронный просмотр одного сериала с другом по эпизодам через веб-версию WeWatch.',
    url: 'https://wewatch.uz/ru/guides/smotret-serial-vmeste',
    type: 'article',
  },
  robots: { index: true, follow: true },
};


const RELATED = [
  { href: '/ru/guides/smotret-serialy-vmeste-besplatno', label: 'Бесплатный сериальный клуб для группы' },
  { href: '/ru/guides/smotret-vmeste-onlayn', label: 'Смотреть вместе онлайн' },
  { href: '/ru/guides/smotret-anime-vmeste', label: 'Смотреть аниме вместе' },
];


/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible
 * HTML, which is what makes that guarantee testable rather than a convention.
 */
const FAQS = [
  { q: 'Если один отстаёт — что происходит?', a: 'WeWatch автоматически синхронизирует всех к позиции хоста. Никто не пропустит важный момент.' },
  { q: 'Можно ли смотреть сериалы с субтитрами?', a: 'Да. Субтитры работают на сайте как обычно — каждый выбирает язык сам.' },
  { q: 'Нужно ли оба иметь аккаунт?', a: 'Создателю комнаты нужен аккаунт WeWatch. Гость может войти по ссылке.' },
  { q: 'Работает ли если мы в разных странах?', a: 'Да. WeWatch работает через интернет — расстояние и страна не важны.' },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'ru',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function SmotretSerialVmestePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/ru/guides/smotret-vmeste-onlayn" className="hover:text-white transition-colors">Смотреть вместе</Link>
            <span className="mx-2">/</span>
            <span>Сериал вместе</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>Смотреть сериал вместе с другом онлайн</h1>
              <p>
            Друг далеко, а новый сезон уже вышел? WeWatch помогает проходить один сериал вместе эпизод за эпизодом — синхронно, с чатом и реакциями.
              </p>
            </div>
            <GuideRoomMockup photo="series-binge" priority />
          </div>
        </div>

        <div className="article shell py-12">

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Идеально для марафона сериалов</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Выберите следующую серию или продолжите сезон: синхронизация удерживает одинаковую позицию у участников, а чат позволяет обсуждать события прямо во время просмотра.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {[
                { title: 'Поддерживаемые источники', desc: 'YouTube, VK Видео, Rutube и прямые MP4-ссылки' },
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
            <GuideSteps
              variant="timeline"
              steps={[
                { n: 1, title: 'Откройте WeWatch', desc: 'Веб-версия доступна сейчас; приложения iOS и Android разрабатываются.' },
                { n: 2, title: 'Добавьте серию', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
                { n: 3, title: 'Создайте комнату и поделитесь ссылкой', desc: 'Одна кнопка — WeWatch создаёт комнату и даёт ссылку для друга.' },
                { n: 4, title: 'Смотрите и общайтесь', desc: 'Пишите в чат прямо во время просмотра — WeWatch не мешает видео.' },
              ]}
            />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Читайте также</h2>
            <div className="flex flex-col gap-2">
              {RELATED.map(({ href, label }) => (
                <Link key={href} href={href} className="text-[#7B72F8] hover:underline text-sm">→ {label}</Link>
              ))}
            </div>
          </section>

          <GuideCTA title="Смотрите сериалы вместе" subtitle="Откройте WeWatch в браузере и начните марафон с другом">
            <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-8 py-3 rounded-xl transition-colors">
              Открыть веб-версию
            </Link>
          </GuideCTA>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-serial-vmeste" />
    </>
  );
}
