import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/guides/kino-ikkovlashib';

export const metadata: Metadata = {
  title: "Ikkovlashib kino ko'rish — masofada ham sinxron",
  description:
    "Ikkovlashib kino ko'rmoqchisiz, lekin turli joydasiz? WeWatch veb-versiyasida ikkala qurilmada sinxron pauza — go'yo yonma-yon o'tirgandek.",
  keywords: [
    "ikkovlashib kino ko'rish",
    "ikkovlashib film ko'rish",
    "ikki kishilik kino ko'rish onlayn",
    "sevgilim bilan kino ko'rish",
    "masofada birga kino ko'rish",
    "onlayn kino ikkovlashib",
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: "Ikkovlashib kino ko'rish — masofada ham sinxron | WeWatch",
    description: "Veb-versiyada ikkovlashib kino ko'ring — bir kishi pauza qilsa, ikkalasida ham pauza.",
    url: 'https://wewatch.uz/uz/guides/kino-ikkovlashib',
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const HOW_TO_STEPS = [
  { n: 1, t: 'Kinoni qo’shing', d: "YouTube, VK Video, Rutube yoki to'g'ridan-to'g'ri MP4 havolasini kiriting." },
  { n: 2, t: 'Xona yarating', d: 'Taklif havolasini ikkinchi kishiga yuboring — ro‘yxatdan o‘tish shart emas.' },
  { n: 3, t: "Sinxron ko'ring", d: 'Biri pauza qilsa — ikkalasida ham pauza. Chatda his-tuyg‘ularingizni yozing.' },
] as const;

const FAQS = [
  { q: "Faqat ikkovlashib ko'rish mumkinmi, ko'proq odam bo'lsa-chi?", a: "Xona 10 kishigacha mo'ljallangan. Ikkovlashib eng ko'p uchraydigan holat, lekin bitta havola bilan boshqalarni ham chaqirish mumkin." },
  { q: "Ikkinchi kishiga akkaunt kerakmi?", a: "Yo'q. Akkaunt faqat xonani yaratuvchiga kerak. Ikkinchisi taklif havolasi orqali ro'yxatdan o'tmasdan kiradi." },
  { q: "Internet tezligimiz har xil — kino tarqalib ketmaydimi?", a: "Yo'q. 500 millisekunddan katta farqni WeWatch avtomatik tuzatadi, ikkalangizni ham asosiy pozitsiyaga tortadi." },
  { q: "Biri telefonda, biri kompyuterda bo'lsa ham ishlaydimi?", a: "Ha. Veb-versiya iPhone, Android va kompyuter brauzerlarida bir xil sinxronlashadi. Mobil ilovalar ishlab chiqilmoqda." },
  { q: "Qanday havolalar mos keladi?", a: "YouTube, VK Video, Rutube va to'g'ridan-to'g'ri MP4 havolalari. Kinoning o'ziga kirish tanlangan manba qoidalariga bog'liq." },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HowTo',
      name: "Ikkovlashib kinoni qanday sinxron ko'raman?",
      description: "WeWatch orqali ikkovlashib kino ko'rishni boshlash — 3 qadam",
      totalTime: 'PT2M',
      step: HOW_TO_STEPS.map((step) => ({
        '@type': 'HowToStep',
        position: step.n,
        name: step.t,
        text: step.d,
      })),
    },
    {
      '@type': 'FAQPage',
      inLanguage: 'uz',
      mainEntity: FAQS.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a },
      })),
    },
  ],
};

export default function KinoIkkovlashibPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="flex-1 bg-page text-white">
        <div className="article max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/kino-birgalikda" className="hover:text-white transition-colors">
              Kino birgalikda
            </Link>
            <span className="mx-2">/</span>
            <span>Ikkovlashib</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ikkovlashib kino ko&apos;rish — masofada ham sinxron
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Ikkovlashib kino ko&apos;rmoqchisiz, lekin yonma-yon emassiz? Veb-versiyani ikkala qurilmada
            oching: biri pauza qilsa — ikkalasida ham pauza. Go&apos;yo bir divanda o&apos;tirgandek.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Ikkovlashib qanday ko&apos;raman — 3 qadam</h2>
            <ol className="space-y-4">
              {HOW_TO_STEPS.map(({ n, t, d }) => (
                <li key={n} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</span>
                  <div>
                    <strong className="text-white">{t}</strong>
                    <p className="text-zinc-400 text-sm mt-1">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Sevgilim yoki eng yaqin do&apos;stim bilan</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Ikkovlashib ko&apos;rish eng oson stsenariy — veb-versiya iPhone va Android brauzerlarida
              kinoni sinxron ushlab turadi. Mobil ilovalar ishlab chiqilmoqda.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Kechqurun yana bir necha kishi qo&apos;shilsa, mexanika o&apos;zgarmaydi — bu umumiy gaydda
              batafsil: <Link href="/uz/guides/kino-birgalikda" className="text-purple-400 hover:underline">do&apos;stlar bilan onlayn kino ko&apos;rish</Link>.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Ko&apos;p so&apos;raladigan savollar</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{q}</div>
                  <div className="text-zinc-400 text-sm">{a}</div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 rounded-2xl p-8 text-center border border-purple-800/30 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Bugun ikkovlashib kino ko&apos;ring</h2>
            <p className="text-zinc-400 mb-6">Asosiy funksiyalar bepul, istagan qurilmadan.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={appUrl('/register')}
                className="inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
              >
                Xona yaratish
              </a>
              <Link
                href="/uz/use-cases/onlayn-uchrashuv"
                className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Onlayn uchrashuv uchun →
              </Link>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <p className="text-zinc-500 text-sm mb-4">Boshqa maqolalar:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uz/guides/kino-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Kino birgalikda →</Link>
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha qilish →</Link>
              <Link href="/ru/guides/smotret-film-vdvoem" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="uz" currentPath="/uz/guides/kino-ikkovlashib" />
    </>
  );
}
