import type { Metadata } from 'next';
import { LandingContent } from '../LandingContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

const LANGUAGES = {
  'x-default': APP_URL,
  'ru': APP_URL,
  'uz': `${APP_URL}/uz`,
  'en': `${APP_URL}/en`,
};

export const metadata: Metadata = {
  title: "WeWatch — Do'stlar bilan birga video ko'rish | Bepul Watch Party",
  description:
    "WeWatch — YouTube, VK va Rutube'ni do'stlaring bilan real vaqtda birga ko'r. Biri telefonda, biri saytda — sinxron ishlaydi. Bepul watch party: chat, emoji. iOS va Android.",
  alternates: {
    canonical: `${APP_URL}/uz`,
    languages: LANGUAGES,
  },
  openGraph: {
    title: "WeWatch — Do'stlar bilan birga video ko'rish onlayn",
    description:
      "Bepul watch party — YouTube, VK, Rutube'ni do'stlar bilan real vaqtda birga ko'r. Sinxronizatsiya, chat, emoji. iOS va Android.",
    url: `${APP_URL}/uz`,
    locale: 'uz_UZ',
    images: [{ url: '/og-image', width: 1200, height: 630, alt: "WeWatch — do'stlar bilan birga video ko'rish" }],
  },
  // Full twitter block: Next.js replaces (not deep-merges) the root layout's
  // Russian twitter metadata, so card/site/images must be repeated here.
  twitter: {
    card: 'summary_large_image',
    site: '@wewatch_app',
    creator: '@wewatch_app',
    title: "WeWatch — Do'stlar bilan birga video ko'rish",
    description:
      "Bepul watch party — YouTube, VK, Rutube'ni do'stlar bilan real vaqtda birga ko'r. Chat, emoji. iOS va Android.",
    images: ['/og-image'],
  },
  robots: { index: true, follow: true },
};

// UZ structured data — gives /uz keyword-rich signals for Uzbek queries
// (birga kino ko'rish, birga serial ko'rish, video birga, birga ko'rish)
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/uz#website`,
      url: `${APP_URL}/uz`,
      name: 'WeWatch',
      alternateName: ['wewatch', 'wewatch.uz', "birga video ko'rish", "birga kino ko'rish"],
      description: "Do'stlar bilan birga video va kino ko'rish — YouTube, VK, Rutube real vaqtda sinxron",
      inLanguage: 'uz',
    },
    {
      '@type': 'MobileApplication',
      '@id': `${APP_URL}/uz#app`,
      name: "WeWatch — birga ko'rish",
      url: `${APP_URL}/uz`,
      description:
        "Do'stlar bilan birga film va video ko'rish uchun bepul ilova. YouTube, VK, Rutube, Uzmove'ni real vaqtda sinxron ko'ring. Chat, emoji-reaksiyalar.",
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'iOS, Android',
      inLanguage: 'uz',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    },
    {
      '@type': 'FAQPage',
      '@id': `${APP_URL}/uz#faq`,
      inLanguage: 'uz',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Do'stlar bilan birga video ko'rish qanday ishlaydi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "WeWatch'ni yuklab oling, ichki brauzerni oching, YouTube, VK yoki Rutube'dan video toping, xona yarating va do'stingizga havola yuboring. Hamma bir xil kadrni real vaqtda ko'radi.",
          },
        },
        {
          '@type': 'Question',
          name: "Birga kino ko'rish bepulmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha, WeWatch to'liq bepul. App Store yoki Google Play'dan yuklab oling va telefon raqami orqali ro'yxatdan o'tib, darhol do'stlaringiz bilan birga kino ko'rishni boshlang.",
          },
        },
        {
          '@type': 'Question',
          name: "Videoni birga qanday ko'rish mumkin?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ichki brauzerda videoni toping, xona yarating va havolani ulashing. Video birga ko'rish uchun ishtirokchilarga havola yuborilishi kifoya — hamma sinxron ko'radi.",
          },
        },
        {
          '@type': 'Question',
          name: "Anime yoki serialni birga ko'rish mumkinmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha, WeWatch ichki brauzer orqali istalgan video-sayt bilan ishlaydi — anime va seriallar ham. Kerakli saytni oching, xona yarating va do'stingiz bilan birga serial ko'ring.",
          },
        },
        {
          '@type': 'Question',
          name: "Biri telefonda, biri saytda bo'lsa birga ko'rish mumkinmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha — WeWatch ko'rishni barcha platformalar o'rtasida bir vaqtda sinxronlaydi. iPhone, Android va kompyuter brauzeri bitta xonada cheklovsiz ishlaydi.",
          },
        },
      ],
    },
  ],
};

export default function UzHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingContent />
    </>
  );
}
