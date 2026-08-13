import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/guides/kino-birgalikda';

export const metadata: Metadata = {
  title: "Do'stlar bilan onlayn kino ko'rish — bepul",
  description:
    "Do'stim bilan onlayn kino ko'rish mumkinmi? Ha — WeWatch orqali do'stlaringiz bilan istalgan filmni sinxron ko'ring. Biri telefonda, biri kompyuterda — bepul ishlaydi.",
  keywords: [
    "do'stlar bilan kino ko'rish",
    "do'stim bilan kino ko'rish onlayn",
    "birga kino ko'rish",
    "onlayn kino birgalikda",
    "do'stlar bilan film ko'rish onlayn",
    "kino birga ko'rish bepul",
    "onlayn kinoteatr do'stlar bilan",
    "masofadan birga kino ko'rish",
    "WeWatch kino",
    "birga kino korish",
    "dostim bilan kino korish",
    "birga film korish onlayn",
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: "Do'stlar bilan onlayn kino ko'rish — bepul | WeWatch",
    description: "Do'stingiz bilan veb-versiyada birga kino ko'ring. iOS va Android ilovalari ishlab chiqilmoqda.",
    url: 'https://wewatch.uz/uz/guides/kino-birgalikda',
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

const HOW_TO_STEPS = [
  { n: 1, t: "WeWatch'ni oching", d: 'Veb-versiyani brauzerda oching; mobil ilovalar ishlab chiqilmoqda.' },
  { n: 2, t: "Kinoni qo'shing", d: "YouTube, VK Video, Rutube yoki to'g'ridan-to'g'ri MP4 havolasini kiriting." },
  { n: 3, t: 'Xona yarating', d: "«Xona yaratish» tugmasini bosing va do'stingizga taklif havolasini yuboring." },
  { n: 4, t: "Birga ko'ring", d: "Do'stingiz havolaga o'tadi — ko'rish sinxronlashadi. Chatda yozing, emoji tashlang, har sahnani muhokama qiling." },
] as const;

const FAQS = [
  { q: "Do'stim bilan onlayn kino ko'rish mumkinmi?", a: "Ha — WeWatch aynan shu uchun yaratilgan. Kinoni toping, xona yarating, havolani yuboring — ikkalangiz bir xil kadrni bir vaqtda ko'rasiz." },
  { q: 'Bepulmi?', a: "Asosiy birgalikda ko'rish funksiyalari bepul. Interfeysda qo'shimcha funksiyalar uchun Pro tarif ham ko'rsatilgan." },
  { q: "Biri telefonda, biri kompyuterda bo'lsa ham ishlaydimi?", a: 'Ha — iPhone, Android va kompyuter brauzerlari bitta xonada sinxron ishlaydi. Mobil ilovalar ishlab chiqilmoqda.' },
  { q: "Do'stim boshqa shaharda bo'lsa-chi?", a: "Masofa muhim emas — sinxronizatsiya internet orqali ishlaydi. Boshqa davlatda bo'lsa ham birga ko'rasiz." },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'HowTo',
      name: "Do'stim bilan onlayn kino qanday ko'raman?",
      description: "WeWatch orqali do'stlar bilan birga kino ko'rishni boshlash — 4 qadam",
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

export default function KinoBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="uz" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav className="text-sm text-zinc-500 mb-8">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/birgalikda-tomosha-qilish" className="hover:text-white transition-colors">
              Birgalikda tomosha
            </Link>
            <span className="mx-2">/</span>
            <span>Kino birgalikda</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Do'stlar bilan onlayn kino ko'rish — bepul
          </h1>

          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Do'stingiz bilan kino ko'rmoqchisiz, lekin har xil joydasizmi? WeWatch buni hal qiladi —
            onlayn sinxron kino ko'rish, bepul, istalgan qurilmada. Go'yo yonma-yon o'tirgandek.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">WeWatch'ning boshqalardan farqi nimada?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Ko'pchilik watch party servislar bitta platformaga bog'langan (faqat Netflix yoki faqat YouTube).
              WeWatch esa <strong className="text-white">YouTube, VK Video, Rutube va to'g'ridan-to'g'ri MP4 havolalarini</strong> qo'llab-quvvatlaydi.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              Yana bir afzallik — veb-versiya: siz iPhone brauzerida, do'stingiz Android yoki noutbuk brauzerida bo'lsa ham,
              sinxronizatsiya barcha qurilmalar o'rtasida bir vaqtda ishlaydi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-6">Do'stim bilan kino qanday ko'raman — 4 qadam</h2>
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
            <h2 className="text-2xl font-bold text-white mb-4">Qanday qurilmalarda ishlaydi?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'iPhone / iPad', desc: 'Veb-brauzer; iOS ilovasi ishlab chiqilmoqda' },
                { label: 'Android', desc: 'Veb-brauzer; Android ilovasi ishlab chiqilmoqda' },
                { label: 'Kompyuter', desc: 'Brauzer orqali (veb versiya)' },
              ].map(({ label, desc }) => (
                <div key={label} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-1">{label}</div>
                  <div className="text-sm text-zinc-400">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Ko'p so'raladigan savollar</h2>
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
            <h2 className="text-2xl font-bold text-white mb-3">Hoziroq birga kino ko'ring</h2>
            <p className="text-zinc-400 mb-6">Bepul, istagan qurilmadan.</p>
            <a
              href={appUrl('/register')}
              className="inline-block bg-purple-600 hover:bg-purple-500 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
            >
              Xona yaratish
            </a>
          </div>

          <div className="border-t border-zinc-800 pt-8">
            <p className="text-zinc-500 text-sm mb-4">Boshqa maqolalar:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha qilish →</Link>
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/serial-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Serial birgalikda →</Link>
              <Link href="/ru/guides/kino-s-drugom-onlayn" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="uz" currentPath="/uz/guides/kino-birgalikda" />
    </>
  );
}
