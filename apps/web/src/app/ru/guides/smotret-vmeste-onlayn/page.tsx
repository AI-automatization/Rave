import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';

export const metadata: Metadata = {
  title: 'Смотреть вместе онлайн бесплатно — синхронный просмотр с друзьями',
  description: 'Смотреть видео вместе с друзьями онлайн — синхронно, прямо в браузере: YouTube, VK Видео, Rutube и прямые MP4-ссылки. Приложения iOS и Android в разработке.',
  keywords: [
    'смотреть вместе онлайн', 'смотреть вместе онлайн бесплатно', 'смотреть вместе',
    'совместный просмотр онлайн', 'синхронный просмотр', 'смотреть фильм вместе онлайн',
    'смотреть видео вместе', 'онлайн кинотеатр с друзьями', 'вместе онлайн',
  ],
  alternates: {
    canonical: 'https://wewatch.uz/ru/guides/smotret-vmeste-onlayn',
    languages: {
      'ru': 'https://wewatch.uz/ru/guides/smotret-vmeste-onlayn',
      'uz': 'https://wewatch.uz/uz/guides/birgalikda-tomosha-qilish',
      'x-default': 'https://wewatch.uz/ru/guides/smotret-vmeste-onlayn',
    },
  },
  openGraph: {
    title: 'Смотреть вместе онлайн бесплатно | WeWatch',
    description: 'Смотреть видео вместе с друзьями — синхронно, через веб-версию. Мобильные приложения разрабатываются.',
    url: 'https://wewatch.uz/ru/guides/smotret-vmeste-onlayn',
    type: 'article',
  },
  robots: { index: true, follow: true },
};



/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible
 * HTML, which is what makes that guarantee testable rather than a convention.
 */
const FAQS = [
  { q: 'Это бесплатно?', a: 'Основные функции совместного просмотра бесплатны. В интерфейсе также указан отдельный Pro-план.' },
  { q: 'Нужна ли регистрация для гостя?', a: 'Создатель комнаты проходит быструю регистрацию. Гость может войти по ссылке.' },
  { q: 'Сколько человек могут смотреть вместе?', a: 'До 10 участников могут находиться в одной комнате.' },
  { q: 'Работает ли без VPN?', a: 'Да, WeWatch работает без VPN. Если видео недоступно в вашем регионе — это ограничение самого сайта, не WeWatch.' },
  { q: 'Чем совместный просмотр видео отличается от просмотра фильма?', a: 'Только длиной ролика и поводом собраться. Комната, синхронизация и приглашение по ссылке одинаковые — отдельный режим для коротких видео включать не нужно.' },
  { q: 'Можно смотреть видео вместе с телефона и с компьютера одновременно?', a: 'Да. Один участник открывает веб-версию на iPhone или Android, другой — на компьютере, синхронизация между ними одинаковая. Нативные приложения находятся в разработке.' },
] as const;

/**
 * B3 — internal linking inside the RU cluster (T-Y202). The anchor text is the
 * query the target page is meant to own, not a generic «читать далее»: this page
 * is the entry point of the cluster, so its outgoing anchors are where the film
 * hub gets its «смотреть кино вместе» signal from.
 */
const RELATED = [
  { href: '/ru/guides/kino-s-drugom-onlayn', label: 'Смотреть кино вместе с другом' },
  { href: '/ru/guides/smotret-film-vdvoem', label: 'Смотреть фильм вдвоём' },
  { href: '/ru/guides/smotret-serial-vmeste', label: 'Смотреть сериал вместе' },
  { href: '/ru/guides/smotret-anime-vmeste', label: 'Смотреть аниме вместе' },
];

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

export default function SmotretVmesteOnlaynPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="article max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/ru" className="hover:text-white transition-colors">WeWatch</Link>
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
              WeWatch делает это просто: откройте веб-версию, добавьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку и создайте комнату. Друзья переходят по приглашению — и вы смотрите вместе, как будто сидите рядом.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Смотреть видео вместе: какие ролики подойдут</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Смотреть видео вместе можно не только полнометражный фильм. Чаще в комнату включают то, что хочется обсуждать прямо по ходу: клип, обзор, запись стрима, лекцию, разбор матча или домашнее видео с телефона.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Разница с фильмом или сериалом — только в длине ролика и в поводе собраться. Механика одна и та же: ссылка → комната → синхронное воспроизведение. Отдельный режим для коротких видео включать не нужно.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Если вечер планируется под длинный просмотр, есть разборы под конкретные сценарии: <Link href="/ru/guides/kino-s-drugom-onlayn" className="text-[#7B72F8] hover:underline">смотреть кино вместе с другом</Link> и <Link href="/ru/guides/smotret-serial-vmeste" className="text-[#7B72F8] hover:underline">смотреть сериал вместе</Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Как смотреть вместе онлайн — 4 шага</h2>
            <ol className="space-y-5">
              {[
                { n: 1, title: 'Откройте WeWatch', desc: 'Веб-версия доступна в браузере; приложения для iOS и Android находятся в разработке.' },
                { n: 2, title: 'Добавьте видео', desc: 'Вставьте ссылку YouTube, VK Видео, Rutube или прямую MP4-ссылку.' },
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
            <p className="text-zinc-400 mb-4">В веб-версии WeWatch подтверждены следующие источники:</p>
            <ul className="grid grid-cols-2 gap-2 text-zinc-400 text-sm">
              {['YouTube (ютуб)', 'VK Видео (ВКонтакте)', 'Rutube (Рутуб)', 'Прямая MP4-ссылка'].map(s => (
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
              Участники могут открыть веб-версию в браузерах на iPhone, Android и компьютере. Нативные мобильные приложения находятся в разработке.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Часто задаваемые вопросы</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
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
            <h2 className="text-2xl font-bold text-white mb-3">Готовы смотреть вместе?</h2>
            <p className="text-zinc-400 mb-6">Откройте веб-версию WeWatch и начните совместный просмотр</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/ru" className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Открыть WeWatch
              </Link>
              <Link href="/ru/guides/smotret-youtube-vmeste" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">
                Гайд: смотреть ютуб вместе →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="ru" currentPath="/ru/guides/smotret-vmeste-onlayn" />
    </>
  );
}
