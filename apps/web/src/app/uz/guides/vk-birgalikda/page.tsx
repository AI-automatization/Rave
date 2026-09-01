import type { Metadata } from 'next';
import Link from 'next/link';
import { GuideArticleEnd } from '@/components/common/GuideChrome';
import { GuideRoomMockup, GuideFAQ } from '@/components/common/GuideArticleUI';
import { hreflangFor } from '@/lib/i18n/routes';
import { appUrl } from '@/lib/app-url';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const PATH = '/uz/guides/vk-birgalikda';

export const metadata: Metadata = {
  title: "VK Video-ni do'st bilan birgalikda ko'rish — sinxron",
  description:
    "WeWatch veb-versiyasi orqali VK Video (VKontakte) videolarini do'stingiz bilan sinxron tomosha qiling. iOS va Android ilovalari ishlab chiqilmoqda.",
  keywords: [
    "vk video birgalikda ko'rish",
    "vk birga korish",
    "vkontakte video birgalikda",
    "vk watch party o'zbek",
    "вк биргаликда",
    "vk video sinxron tomosha",
    "do'st bilan vk video ko'rish",
    "vk birga onlayn",
    "vkontakte birgalikda tomosha",
  ],
  alternates: {
    canonical: `${APP_URL}${PATH}`,
    languages: hreflangFor(PATH, APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: "VK Video birgalikda ko'rish — bepul | WeWatch",
    description: "VK Video-ni do'stingiz bilan sinxron tomosha qiling. Bir kishi pause bosdi — hammaga to'xtaydi.",
    url: `https://wewatch.uz${PATH}`,
    type: 'article',
  }),
  robots: { index: true, follow: true },
};

/**
 * Rendered as the visible FAQ and published as FAQPage from this one array — the
 * same rule the guide registry follows, so the schema cannot drift from the page.
 * seo-geo-aeo.spec.ts asserts every question and answer appears in the visible HTML.
 */
const FAQS = [
  {
    q: 'VK akkaunti kerakmi?',
    a: "Ochiq (public) videolar uchun shart emas. Yopiq video bo'lsa, unga VK'da kirish huquqi kerak.",
  },
  {
    q: "Do'stim boshqa shaharda bo'lsa ham ishlaydimi?",
    a: "Ha, internet bo'lsa bas. Toshkent, Samarqand, Moskva — farqi yo'q.",
  },
  {
    q: 'Bepulmi?',
    a: "Ha, WeWatch'ning asosiy birgalikda ko'rish funksiyalari bepul.",
  },
] as const;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  inLanguage: 'uz',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function VkBirgalikdaPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="guide-page flex-1 bg-page text-white">
        <div className="page-hero shell relative pt-16 pb-8">
          <nav className="text-sm text-zinc-500">
            <Link href="/uz" className="hover:text-white transition-colors">WeWatch</Link>
            <span className="mx-2">/</span>
            <Link href="/uz/guides/vk-birgalikda" className="hover:text-white transition-colors">
              VK Video birgalikda
            </Link>
          </nav>

          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1>VK Video-ni do'st bilan birgalikda ko'rish</h1>
              <p>
                WeWatch orqali VK Video (VKontakte) videolarini do'stingiz bilan onlayn sinxron holda
                tomosha qiling. Pause bosasiz — u ham to'xtaydi. Masofa muhim emas.
              </p>
            </div>
            <GuideRoomMockup locale="uz" photo="couple-tv" priority />
          </div>
        </div>

        <div className="article shell py-12">

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Nima uchun oddiy VK link yubormaysiz?</h2>
            <p className="text-zinc-400 leading-relaxed mb-4">
              Odatda VK video havolasini yuborsangiz, ikkovingiz bir xil videoni ochasiz, lekin sinxron emas:
              biri oldinda, ikkinchisi orqada. Kulgili sahnani bir vaqtda ko'rmaysiz.
            </p>
            <p className="text-zinc-400 leading-relaxed">
              WeWatch VK oqimini olib, hamma uchun bitta ijro vaqtini ushlab turadi — shuning uchun hamma bir
              xil kadrni bir vaqtda ko'radi. Kimdir internet tufayli kechiksa, server hammani kutib turadi.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">VK Video-ni birgalikda qanday ko'rish mumkin?</h2>
            <ol className="space-y-4">
              {[
                { n: '1', t: "WeWatch'ni oching", d: "wewatch.uz'ni brauzerda oching; iOS va Android ilovalari ishlab chiqilmoqda." },
                { n: '2', t: 'VK videoni toping', d: 'WeWatch brauzerida VK Video-ni oching va rolik, klip yoki filmni tanlang.' },
                { n: '3', t: 'Yangi xona yarating', d: "'Xona yaratish' tugmasini bosing va taklif havolasini do'stingizga yuboring." },
                { n: '4', t: 'Birgalikda tomosha boshlang', d: "Do'stingiz qo'shilgach play bosing — WeWatch VK oqimini hammada sinxron ushlaydi." },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">{n}</span>
                  <div>
                    <strong className="text-white">{t}</strong>
                    <p className="text-zinc-400 text-sm mt-1">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Afzalliklari</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Sinxron tomosha', desc: 'Bir kadr — bir vaqtda. Server barcha ishtirokchilarni sinxronlashtiradi.' },
                { title: "Bepul va ro'yxatsiz", desc: "Xona yaratuvchi ro'yxatdan o'tadi, do'stingiz shunchaki havola orqali kiradi." },
                { title: 'Har qanday qurilma', desc: 'iPhone, Android yoki kompyuter brauzerida ishlaydi; mobil ilovalar ishlab chiqilmoqda.' },
                { title: 'Demokratik pause', desc: "Kimdir internet tufayli to'xtatsa — server hammani kutib turadi." },
              ].map(({ title, desc }) => (
                <div key={title} className="bg-zinc-900 rounded-xl p-5 border border-zinc-800">
                  <div className="font-semibold text-white mb-2">{title}</div>
                  <div className="text-sm text-zinc-400">{desc}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Ko'p so'raladigan savollar</h2>
            <GuideFAQ items={FAQS.map(({ q, a }) => ({ q, a }))} />
          </section>

          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 text-center border border-blue-800/20 mb-10">
            <h2 className="text-2xl font-bold text-white mb-3">Do'stingiz bilan VK Video ko'ring</h2>
            <p className="text-zinc-400 mb-6">Hoziroq bepul boshlang — ro'yxatdan o'tish shart emas.</p>
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
              <Link href="/uz/guides/rutube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Rutube birgalikda →</Link>
              <Link href="/uz/guides/youtube-birgalikda" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">YouTube birgalikda →</Link>
              <Link href="/uz/guides/birgalikda-tomosha-qilish" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">Birgalikda tomosha →</Link>
              <Link href="/ru/guides/smotret-vk-video-vmeste" className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors">На русском →</Link>
            </div>
          </div>
        </div>
      </main>
      <GuideArticleEnd locale="uz" currentPath="/uz/guides/vk-birgalikda" />
    </>
  );
}
