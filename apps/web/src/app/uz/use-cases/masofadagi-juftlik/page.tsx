import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/use-cases/masofadagi-juftlik';

export const metadata: Metadata = {
  title: "Masofadan turib birga kino ko'rish — ajralgan juftliklar uchun",
  description:
    "Yaringiz uzoqdami? Kino va seriallarni onlayn, sinxron, xuddi yonma-yon o'tirgandek birga ko'ringiz. WeWatch — turli shahar va davlatlardagi juftliklar uchun masofadan uchrashuv.",
  keywords: [
    "masofadan birga kino ko'rish", "yigit bilan masofadan kino ko'rish",
    "qiz bilan masofadan tomosha qilish", "masofadagi munosabatlar birga ko'rish",
    'onlayn uchrashuv masofadan', 'masofadagi munosabatlarda nima qilish',
    "sevgan bilan onlayn kino ko'rish", 'juftliklar uchun watch party',
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: "Masofadan turib birga ko'rish — WeWatch",
    description: "Ajralgan juftliklar uchun onlayn uchrashuv: kino va seriallar sinxron, xuddi yonginangizda.",
    url: `${APP_URL}${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};


const STEPS = [
  { n: 1, title: 'Kinoni oldindan tanlangiz', desc: "Kino yoki serial haqida kelishingiz — YouTube, VK Video yoki Rutube'da." },
  { n: 2, title: 'Xona yaratingiz', desc: "Biringiz WeWatch'da xona yaratadi va havolani ikkinchisiga yuboradi." },
  { n: 3, title: "Sinxron ko'ringiz", desc: "Ko'rish bir vaqtda ketadi. «Gaplashish uchun» pauza — ikkalangizda ham. Fikrlar — chatda." },
];

const FAQS = [
  { q: 'Turli davlatlar orasida ishlaydimi?', a: "Ha. Sinxronizatsiya masofaga bog'liq emas — faqat internet ulanishi muhim." },
  { q: 'Bir xil telefon kerakmi?', a: "Yo'q. Veb-versiyani iPhone yoki Android brauzerida ochish mumkin; mobil ilovalar ishlab chiqilmoqda." },
  { q: 'Bu bepulmi?', a: 'Ha, WeWatch bepul.' },
];

export default function MasofadagiJuftlikPage() {
  return (
    <>
      <main className="flex-1 bg-page text-white">
        <div className="article max-w-3xl mx-auto px-4 py-16">
          <nav aria-label="Yo'l xaritasi" className="text-sm text-zinc-500 mb-8">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <span>Masofadagi munosabatlar</span>
          </nav>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Uzoqda bo&apos;lsangiz ham kinoni birga ko&apos;ringiz
          </h1>
          <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
            Turli shahar yoki davlat — ikki kishilik kecha uchun to&apos;siq emas. WeWatch kinoni
            telefonlaringizda sinxronlaydi: siz pauza bosasiz — yaringizda ham pauza.
            Xuddi bitta divanda o&apos;tirgandek.
          </p>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Yozishmalar emas, onlayn uchrashuv</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Masofadagi munosabatlar birga o&apos;tkazilgan lahzalar bilan tik turadi. Yozishmadagi
              «nima ko&apos;rayapsan?» o&apos;rniga — ikki kishiga bitta kinoni qo&apos;yingiz. WeWatch kadrni
              sinxron ushlab turadi, ichki chat va emoji esa jonli fikr bildirish imkonini beradi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-6">Masofadan kino kechasini qanday uyushtirish</h2>
            <ol className="space-y-5">
              {STEPS.map(({ n, title, desc }) => (
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
            <h2 className="text-2xl font-bold mb-4">Nega WeWatch, «uchgacha sanab qo&apos;yamiz» emas</h2>
            <p className="text-zinc-400 leading-relaxed">
              «Uch-ikki-bir» deb qo&apos;lda sinxronlash birinchi pauzada tarqab ketadi. WeWatch vaqtni
              avtomatik ushlab turadi: oldinga o&apos;tish, buferlanish, har xil internet tezligi — hammasi
              tekislanadi. Veb-versiya iPhone va Android brauzerlarida ishlaydi; mobil ilovalar ishlab chiqilmoqda.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4">Savollar</h2>
            <div className="space-y-4">
              {FAQS.map(({ q, a }) => (
                <details key={q} className="border border-zinc-800 rounded-xl p-4">
                  <summary className="text-white font-medium cursor-pointer">{q}</summary>
                  <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </section>

          <div className="bg-[#7B72F8]/10 border border-[#7B72F8]/30 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ikki kishilik kechani bugun uyushtiringiz</h2>
            <p className="text-zinc-400 mb-6">Masofa muhim emas — WeWatch bepul</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={appUrl('/register')} className="inline-flex items-center justify-center gap-2 bg-[#7B72F8] hover:bg-[#6a63e8] text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                Bepul boshlash
              </a>
              <Link href="/uz/use-cases/onlayn-uchrashuv" className="inline-flex items-center justify-center gap-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium px-6 py-3 rounded-xl transition-colors">
                Onlayn uchrashuv →
              </Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="uz" currentPath={PATH} />
    </>
  );
}
