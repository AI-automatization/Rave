import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';
import { SynchronizationFacts } from '@/components/common/SynchronizationFacts';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/how-it-works';

export const metadata: Metadata = {
  title: "WeWatch qanday ishlaydi — 4 qadamda birga video ko'rish",
  description:
    "WeWatch veb-versiyasi bilan do'stlar bilan birga video ko'rish: videoni oching, xona yarating va havolani yuboring. iOS va Android ilovalari ishlab chiqilmoqda.",
  keywords: [
    'watch party qanday ishlaydi', "birgalikda video ko'rish qanday",
    'xona qanday yaratiladi', "do'stlar bilan kino ko'rish qanday",
    'wewatch qanday ishlatiladi', 'sinxron tomosha',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'WeWatch qanday ishlaydi',
    description: "4 qadamda birgalikda ko'rish — barcha qurilmalarda sinxron.",
    url: `${APP_URL}${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const steps = [
  {
    n: 1,
    title: "WeWatch'ni oling",
    desc: "wewatch.uz'ni har qanday brauzerda oching. iOS va Android ilovalari ishlab chiqilmoqda.",
  },
  {
    n: 2,
    title: "Videoni qo'shing",
    desc: "YouTube, VK Video, Rutube yoki to'g'ridan-to'g'ri MP4 havolasini veb-versiyaga kiriting.",
  },
  {
    n: 3,
    title: 'Xona yaratingiz',
    desc: "«Xona yaratish»ni bosingiz — WeWatch sizga taklif havolasini beradi. Uni do'stlaringizga istalgan messenjerda yuboringiz.",
  },
  {
    n: 4,
    title: "Sinxron ko'ringiz",
    desc: "Do'stingiz havolani bosadi va ko'rish sinxronlanadi. Pauza, oldinga o'tish va tezlik hamma uchun bir vaqtda qo'llaniladi.",
  },
];

// 500 ms — shared/src/constants dagi drift tuzatish chegarasi (SYNC_DRIFT_WINDOW_MS),
// marketing raqami emas. Ingliz versiyasi shu qiymatni keltiradi.
const howToLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: "WeWatch bilan birgalikda video qanday ko'riladi",
  description: "Do'stlar bilan onlayn birga video ko'rish uchun qadamba-qadam ko'rsatma.",
  inLanguage: 'uz',
  totalTime: 'PT1M',
  url: `${APP_URL}${PATH}`,
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}${PATH}` },
  step: steps.map((s) => ({ '@type': 'HowToStep', position: s.n, name: s.title, text: s.desc })),
};

const FAQS = [
  { q: 'Bepulmi?', a: "Asosiy birgalikda ko'rish funksiyalari bepul. Qo'shimcha funksiyalar uchun Pro tarif interfeysda ko'rsatilgan, production to'lovi esa hali tasdiqlanishi kerak." },
  { q: 'Mehmonga akkaunt kerakmi?', a: "Xona yaratgan odam ro'yxatdan o'tadi; mehmonlar taklif havolasi orqali akkauntsiz qo'shiladi." },
  { q: 'Nimada ishlaydi?', a: "Hozir veb-versiya telefon va kompyuter brauzerlarida ishlaydi. iOS va Android ilovalari ishlab chiqilmoqda." },
  { q: "Qaysi manbalar qo'llab-quvvatlanadi?", a: "YouTube, VK Video, Rutube va to'g'ridan-to'g'ri .mp4 havolalari." },
];

export default function UzHowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <main className="flex-1 bg-page text-white">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 right-0 h-80 w-[36rem] rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="page-hero relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-14">
            <nav aria-label="Yo'l xaritasi" className="text-sm text-zinc-500 mb-6">
              <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span>Qanday ishlaydi</span>
            </nav>
            <span className="inline-flex items-center rounded-full border border-[#7B72F8]/30 bg-[#7B72F8]/10 px-3 py-1 text-xs font-semibold text-[#9B92FF] mb-5">
              4 qadam · bir daqiqadan kam
            </span>
            <h1 className="text-4xl md:text-5xl font-bold mb-5 leading-tight tracking-tight">WeWatch qanday ishlaydi</h1>
            <p className="text-xl text-zinc-400 leading-relaxed max-w-2xl">
              Do&apos;stlar bilan video ko&apos;rish — to&apos;rt qadamda. Biri pauza bosadi — hammada pauza.
              Veb-versiya iPhone, Android va kompyuter brauzerlarida ishlaydi; mobil ilovalar ishlab chiqilmoqda.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <section className="mb-14">
            <ol className="relative space-y-4 before:absolute before:left-5 before:top-6 before:bottom-6 before:w-px before:bg-gradient-to-b before:from-[#7B72F8]/50 before:to-transparent">
              {steps.map(({ n, title, desc }) => (
                <li key={n} data-howto-step className="relative flex gap-5 rounded-2xl border border-zinc-800/60 bg-[#0E0E14] p-5 hover:border-[#7B72F8]/40 transition-colors">
                  <span className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[#7B72F8] flex items-center justify-center text-base font-bold shadow-lg shadow-[#7B72F8]/30">{n}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
                    <p className="text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <SynchronizationFacts locale="uz" />

          <section className="mb-14">
            <h2 className="text-2xl font-bold mb-5">Ko&apos;p beriladigan savollar</h2>
            <div className="space-y-3">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="group border border-zinc-800/60 bg-[#0E0E14] rounded-xl px-5 py-4 open:border-[#7B72F8]/40 transition-colors">
                  <summary className="flex items-center justify-between gap-4 text-white font-medium cursor-pointer list-none select-none">
                    {q}
                    <span className="shrink-0 text-zinc-500 group-open:rotate-45 group-open:text-[#7B72F8] transition-transform text-lg leading-none">+</span>
                  </summary>
                  <p className="text-zinc-400 text-sm mt-3 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
            <p className="text-zinc-400 text-sm mt-5">
              Boshqa javoblar{' '}
              <Link href="/uz/faq" className="text-[#7B72F8] hover:text-[#9B92FF] underline underline-offset-4 transition-colors">
                to&apos;liq FAQ
              </Link>
              &nbsp;bo&apos;limida.
            </p>
          </section>

          <div className="relative overflow-hidden bg-gradient-to-br from-[#141225] to-[#0E0E14] border border-[#7B72F8]/30 rounded-3xl p-8 text-center">
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[90px]" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-3">Sinab ko&apos;rasizmi?</h2>
              <p className="text-zinc-400 mb-6">Birinchi xonangizni bir daqiqadan kam vaqtda yaratingiz</p>
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#7B72F8]/25">
                Bepul boshlash
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
