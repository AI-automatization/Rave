import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideHeader, GuideFooter } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/use-cases/onlayn-uchrashuv';

export const metadata: Metadata = {
  title: "Onlayn uchrashuv: ikki kishilik kino kechasi — WeWatch",
  description:
    "Onlayn uchrashuvda nima qilishni bilmayapsizmi? Ikki kishiga bitta kinoni qo'yingiz. WeWatch ko'rishni sinxronlaydi, chat va emoji «yonma-yon o'tirish»ni almashtiradi.",
  keywords: [
    'onlayn uchrashuv', 'onlayn uchrashuv uchun g\'oyalar', "masofadan kino kechasi",
    "ikki kishilik kino kechasi", "onlayn uchrashuvda nima qilish",
    "qiz bilan onlayn kino ko'rish", 'romantik onlayn kecha',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  openGraph: {
    title: 'Onlayn uchrashuv: ikki kishilik kino kechasi',
    description: "WeWatch ko'rishni sinxronlaydi — chat va emoji bilan haqiqiy uchrashuv muhiti.",
    url: `${APP_URL}${PATH}`,
    locale: 'uz_UZ',
    type: 'article',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Onlayn uchrashuv: ikki kishilik kino kechasi',
  description: "WeWatch'da kinoni birga ko'rish orqali romantik onlayn uchrashuvni qanday uyushtirish.",
  author: { '@type': 'Organization', name: 'WeWatch', url: APP_URL },
  publisher: { '@type': 'Organization', name: 'WeWatch', url: APP_URL },
  datePublished: '2026-07-28',
  inLanguage: 'uz',
  mainEntityOfPage: `${APP_URL}${PATH}`,
};

const IDEAS = [
  { t: 'Romantik komediya', d: "Birinchi uchrashuvning klassikasi — yengil kino va chatdagi fikrlar." },
  { t: 'Serial — qism-qism', d: "Serialni birga boshlangiz va har kecha bir qismini ko'ringiz." },
  { t: 'Qo\'rqinchli kino', d: "Birga qo'rqish — yaqinlashishning tez yo'li. «Qo'rqinchli joyda» pauza — ikkalangizda ham." },
  { t: 'Nostalgiya', d: "Bolalikdan qolgan kinoni qo'yingiz va chatda xotiralarni bo'lishingiz." },
];

export default function OnlaynUchrashuvPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuideHeader locale="uz" />
      <main className="min-h-screen bg-[#060608] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <nav aria-label="Yo'l xaritasi" className="text-sm text-zinc-500 mb-8">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Onlayn uchrashuv</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Onlayn uchrashuv: ikki kishilik kino kechasi
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Onlayn uchrashuvda nima qilishni bilmayapsizmi? Ikki kishiga bitta kinoni qo&apos;yingiz.
            WeWatch ko&apos;rishni sinxronlaydi, chat va emoji esa «yonma-yon o&apos;tirish»ni almashtiradi —
            haqiqiy uchrashuv muhiti.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Kinoli onlayn uchrashuv uchun g&apos;oyalar</h2>
            <ul className="space-y-4">
              {IDEAS.map(({ t, d }) => (
                <li key={t} className="border border-zinc-800 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-1">{t}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{d}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Bir daqiqada qanday sozlash</h2>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch&apos;ni yuklab olingiz, kinoni ilova brauzerida ochingiz, xona yaratingiz va havolani
              yuboringiz. Yaringiz havolani bosadi — va siz sinxron ko&apos;rasiz. iPhone, Android va
              kompyuter o&apos;rtasida ishlaydi.
            </p>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Uchrashuvni bugun uyushtiringiz</h2>
            <p className="text-zinc-400 mb-6">WeWatch bepul — bir daqiqada boshlangiz</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Bepul boshlash
              </a>
              <Link href="/uz/use-cases/masofadagi-juftlik" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">
                Masofadagi munosabatlar →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <GuideFooter locale="uz" />
    </>
  );
}
