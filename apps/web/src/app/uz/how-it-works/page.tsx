import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/how-it-works';

export const metadata: Metadata = {
  title: "WeWatch qanday ishlaydi — 4 qadamda birga video ko'rish",
  description:
    "WeWatch bilan do'stlar bilan birga video ko'rish: ilovani o'rnatingiz, videoni ochingiz, xona yaratingiz, havolani yuboringiz. iOS, Android va vebda sinxron ishlaydi.",
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
    desc: "wewatch.uz'ni har qanday brauzerda ochingiz yoki App Store'dan bepul ilovani o'rnatingiz. Ro'yxatdan o'tish taxminan 30 soniya oladi.",
  },
  {
    n: 2,
    title: 'Istalgan videoni ochingiz',
    desc: "YouTube, VK Video yoki Rutube havolasini qo'yingiz. Mobil ilovadagi ichki brauzer boshqa video saytlarni ham ochadi — kino, serial yoki klip topingiz.",
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
  { q: 'Bepulmi?', a: "Ha, to'liq bepul. Vaqt cheklovi yo'q, yaratadigan xonalar soniga ham cheklov yo'q." },
  { q: 'Mehmonga akkaunt kerakmi?', a: "Xona yaratgan odam ro'yxatdan o'tadi; mehmonlar taklif havolasi orqali akkauntsiz qo'shiladi." },
  { q: 'Nimada ishlaydi?', a: "iOS, Android va har qanday veb-brauzer. Bitta xonada ishtirokchilar turli platformalarda bo'lishi mumkin." },
  { q: "Qaysi saytlar qo'llab-quvvatlanadi?", a: "YouTube, VK Video, Rutube, to'g'ridan-to'g'ri .mp4 havolalari va mobil ichki brauzer orqali boshqalar." },
];

export default function UzHowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToLd) }} />
      <GuideHeader locale="uz" />
      <main className="min-h-screen bg-[#060608] text-white">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 right-0 h-80 w-[36rem] rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-16 pb-14">
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
              iPhone, Android va kompyuter brauzeri o&apos;rtasida bir vaqtda ishlaydi.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
          <section className="mb-14">
            <ol className="relative space-y-4 before:absolute before:left-5 before:top-6 before:bottom-6 before:w-px before:bg-gradient-to-b before:from-[#7B72F8]/50 before:to-transparent">
              {steps.map(({ n, title, desc }) => (
                <li key={n} className="relative flex gap-5 rounded-2xl border border-zinc-800/60 bg-[#0E0E14] p-5 hover:border-[#7B72F8]/40 transition-colors">
                  <span className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-[#7B72F8] flex items-center justify-center text-base font-bold shadow-lg shadow-[#7B72F8]/30">{n}</span>
                  <div>
                    <h2 className="text-lg font-semibold text-white mb-1">{title}</h2>
                    <p className="text-zinc-400 leading-relaxed">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-14 rounded-2xl border border-zinc-800/60 bg-[#0E0E14] p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4">Sinxronizatsiya qanday ishlaydi</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Har bir ishtirokchi bitta ko&apos;rish pozitsiyasini bo&apos;lishadi. Kimdir pauza bosganda,
              oldinga o&apos;tganda yoki tezlikni o&apos;zgartirganda, buyruq shunchaki uzatilmaydi — u umumiy
              kelajak vaqt belgisiga rejalashtiriladi, shuning uchun tez va sekin ulanish ham bir xil
              real vaqtda harakat qiladi. Har bir qurilma o&apos;z soatining serverdan farqini biladi — u
              WebSocket ulanishi orqali NTP uslubida o&apos;lchanadi.
            </p>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Siljish baribir bo&apos;ladi — buferlanish, reklama, sekin telefon. Davriy tekshiruv har bir
              qurilmani xona pozitsiyasi bilan solishtiradi va 500 ms dan ortiq har qanday farqni
              avtomatik to&apos;g&apos;rilaydi — hech kim videoni qaytadan boshlashi kerak emas.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              VPN kerak emas. Agar video sizning mintaqangizda mavjud bo&apos;lmasa — bu manba saytning
              cheklovi, WeWatch&apos;ning emas.
            </p>
          </section>

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
            <p className="text-zinc-500 text-sm mt-5">
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
      <GuideFooter locale="uz" />
    </>
  );
}
