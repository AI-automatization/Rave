import type { Metadata } from 'next';
import Link from 'next/link';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/faq';

export const metadata: Metadata = {
  title: "FAQ — Ko'p so'raladigan savollar",
  description:
    "WeWatch haqida javoblar: YouTube'ni do'st bilan qanday birga ko'rish, qaysi platformalar qo'llab-quvvatlanadi, bepulmi va sinxronizatsiya qanday ishlaydi.",
  keywords: [
    'wewatch faq', "birgalikda video ko'rish", "youtube birga ko'rish",
    'watch party nima', "do'stlar bilan kino ko'rish", 'sinxron video',
    'bepul watch party',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: "FAQ — Ko'p so'raladigan savollar | WeWatch",
    description: "WeWatch haqida: veb-sinxronizatsiya, bepul tarif va ishlab chiqilayotgan iOS/Android ilovalari.",
    url: `${APP_URL}${PATH}`,
  }),
  robots: { index: true, follow: true },
};

// Faktlar (10 ishtirokchi, 500 ms drift, 10 daqiqa harakatsizlik) —
// shared/src/constants dan. Ruscha va ingliz FAQ shu raqamlarni keltiradi.
const faqs = [
  {
    q: "YouTube'ni do'st bilan onlayn qanday birga ko'raman?",
    a: "Brauzerda wewatch.uz'ni oching. «Xona yaratish»ni bosib, YouTube havolasini qo'ying va xona havolasini do'stingizga yuboring. iOS va Android ilovalari ishlab chiqilmoqda.",
  },
  {
    q: 'Watch party nima?',
    a: "Watch party — internet orqali sinxron birgalikda ko'rish. Bir necha kishi bitta videoni real vaqtda ko'radi, xuddi yonma-yon o'tirgandek. WeWatch ko'rishni tekislab turadi: play, pauza va oldinga o'tish xonadagi hamma uchun bir vaqtda sodir bo'ladi.",
  },
  {
    q: "WeWatch qaysi video xizmatlarni qo'llab-quvvatlaydi?",
    a: "WeWatch veb-versiyada YouTube, VK Video, Rutube va to'g'ridan-to'g'ri .mp4 havolalarini qo'llab-quvvatlaydi.",
  },
  {
    q: 'WeWatch bepulmi?',
    a: "Asosiy birgalikda ko'rish funksiyalari bepul. Qo'shimcha funksiyalar uchun Pro tarif ko'rsatilgan; production to'lovi hali tasdiqlanishi kerak.",
  },
  {
    q: 'WeWatch Android’da ishlaydimi?',
    a: "WeWatch'ning iOS va Android ilovalari faol ishlab chiqilmoqda. Hozir wewatch.uz veb-versiyasi telefon va kompyuter brauzerlarida ishlaydi.",
  },
  {
    q: "Biri telefondan, biri kompyuterdan ko'rsa bo'ladimi?",
    a: "Ha. Ishtirokchilar veb-versiyani iPhone, Android va kompyuter brauzerlarida ochib, bitta sinxron xonaga qo'shila oladi. Mobil ilovalar ishlab chiqilmoqda.",
  },
  {
    q: 'Video sinxronizatsiyasi qanday ishlaydi?',
    a: "Har bir qurilma o'z soatining serverdan farqini NTP uslubida — WebSocket orqali ping/echo almashinuvi bilan — o'lchaydi. Ko'rish buyruqlari kelgan zahoti bajarilmaydi, ular umumiy kelajak vaqt belgisiga rejalashtiriladi; bu ishtirokchilar orasidagi tarmoq kechikishi farqini yutadi. Davriy tekshiruv har bir qurilmani xona pozitsiyasi bilan solishtiradi va 500 ms dan ortiq siljishni avtomatik to'g'rilaydi.",
  },
  {
    q: "Ko'rish uchun akkaunt kerakmi?",
    a: "Xona yaratish va ko'rishni boshqarish uchun bepul akkaunt kerak. Agar kimdir sizga xona havolasini yuborsa, mehmon sifatida kirib, ro'yxatdan o'tmasdan ko'rishingiz mumkin.",
  },
  {
    q: 'Bitta xonada necha kishi bo‘lishi mumkin?',
    a: "Bitta xonada 10 nafargacha ishtirokchi. Xona 10 daqiqa harakatsizlikdan keyin avtomatik yopiladi.",
  },
  {
    q: 'Brauzer kengaytmasi kerakmi?',
    a: "Yo'q. Hozir WeWatch veb-versiyasi brauzerda ishlaydi va kengaytma o'rnatishni talab qilmaydi. iOS va Android ilovalari ishlab chiqilmoqda.",
  },
  {
    q: "Turli davlatlardan birga ko'rsa bo'ladimi?",
    a: "Ha. Masofa sinxronizatsiyaga ta'sir qilmaydi, chunki ko'rish ishtirokchilar orasida uzatilmaydi — umumiy server soatiga nisbatan rejalashtiriladi. Turli qit'alardagi odamlar ham tekis qoladi.",
  },
  {
    q: "Ko'rish davomida yozishsa bo'ladimi?",
    a: "Ha. Har bir xonada video bilan yonma-yon jonli chat va emoji reaksiyalar ishlaydi — xonadan chiqmasdan yoki ikkinchi ilovani ochmasdan fikr bildirishingiz mumkin.",
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  '@id': `${APP_URL}${PATH}#faq`,
  inLanguage: 'uz',
  mainEntity: faqs.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function UzFaqPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex-1 bg-page text-zinc-300">
        {/* Hero with a soft brand-purple glow behind the heading */}
        <div className="relative overflow-hidden border-b border-zinc-800/50">
          <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[120px]" />
          <div className="page-hero relative max-w-4xl mx-auto px-6 pt-16 pb-14">
            <nav aria-label="Yo'l xaritasi" className="text-zinc-600 text-xs mb-6">
              <Link href="/uz" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-500">FAQ</span>
            </nav>
            <p className="text-[#9B92FF] text-xs font-semibold uppercase tracking-[0.2em] mb-3">Yordam markazi</p>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">Ko&apos;p so&apos;raladigan savollar</h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
              WeWatch haqida bilishga arziydigan hamma narsa — sinxronizatsiya,
              qo&apos;llab-quvvatlanadigan platformalar, narx va texnik tafsilotlar.
            </p>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-6 py-14">
          <div className="space-y-3">
            {faqs.map(({ q, a }, i) => (
              <details key={i} className="group bg-[#0E0E14] border border-zinc-800/60 rounded-2xl overflow-hidden transition-colors hover:border-zinc-700/70 open:border-[#7B72F8]/40 open:bg-[#111118]">
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
                  <h2 className="text-white font-semibold text-base leading-snug group-hover:text-white">{q}</h2>
                  <span className="shrink-0 w-7 h-7 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400 group-open:bg-[#7B72F8] group-open:text-white group-open:rotate-45 transition-all duration-200 text-lg leading-none">+</span>
                </summary>
                <div className="px-6 pb-6 pt-0">
                  <p className="text-zinc-400 leading-7 text-sm border-t border-zinc-800/50 pt-4">{a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-14 relative overflow-hidden bg-gradient-to-br from-[#141225] to-[#0E0E14] border border-[#7B72F8]/30 rounded-3xl px-8 py-10 text-center">
            <div aria-hidden className="pointer-events-none absolute -bottom-24 left-1/2 h-56 w-96 -translate-x-1/2 rounded-full bg-[#7B72F8]/20 blur-[90px]" />
            <div className="relative">
              <p className="text-zinc-400 mb-1.5">Javobingizni topmadingizmi?</p>
              <p className="text-white font-semibold text-xl mb-5">Bizga to&apos;g&apos;ridan-to&apos;g&apos;ri yozingiz</p>
              <a
                href="mailto:support@wewatch.uz"
                className="inline-flex items-center gap-2 bg-[#7B72F8] hover:bg-[#6B62E8] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-lg shadow-[#7B72F8]/25"
              >
                support@wewatch.uz
              </a>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-zinc-800/40">
            <p className="text-zinc-600 text-sm mb-4">Foydali gaydlar:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                YouTube&apos;ni birga ko&apos;rish →
              </Link>
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Birgalikda tomosha qilish →
              </Link>
              <Link href="/uz/guides/kino-birgalikda" className="text-sm text-[#7B72F8] hover:text-[#9B92FF] transition-colors underline underline-offset-4">
                Do&apos;stlar bilan kino ko&apos;rish →
              </Link>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
