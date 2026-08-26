import type { Metadata } from 'next';
import { LandingContent } from '@/components/landing/LandingContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { publishHomepageSchema } from '@/data/homepage-schema';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

// Single source: hreflangFor derives every locale's home URL from the routing
// config, so the three home pages cannot drift apart (they did — all three
// claimed the Russian home page lived at the bare domain, which stopped being
// true when Russian moved under /ru).
const LANGUAGES = hreflangFor('/', APP_URL);

export const metadata: Metadata = {
  title: { absolute: "WeWatch — Do'stlar bilan birga video ko'rish | Bepul Watch Party" },
  description:
    "WeWatch — YouTube, VK va Rutube'ni do'stlaring bilan vebda real vaqtda birga ko'r. Bepul watch party: chat va emoji. iOS va Android ilovalari ishlab chiqilmoqda.",
  alternates: {
    canonical: `${APP_URL}/uz`,
    languages: LANGUAGES,
  },
  openGraph: {
    title: "WeWatch — Do'stlar bilan birga video ko'rish onlayn",
    description:
      "Bepul veb watch party — YouTube, VK va Rutube'ni do'stlar bilan real vaqtda birga ko'r. iOS va Android ilovalari ishlab chiqilmoqda.",
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
      "Bepul veb watch party — YouTube, VK va Rutube'ni do'stlar bilan real vaqtda birga ko'r. iOS va Android ilovalari ishlab chiqilmoqda.",
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
      alternateName: ['wewatch', 'wewatch.uz', "birga video ko'rish", "birga kino ko'rish", "do'stlar bilan kino ko'rish"],
      description: "Do'stlar bilan birga video va kino ko'rish — YouTube, VK, Rutube real vaqtda sinxron",
      inLanguage: 'uz',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/uz#app`,
      name: "WeWatch — birga ko'rish",
      url: `${APP_URL}/uz`,
      description:
        "Do'stlar bilan YouTube, VK Video, Rutube va to'g'ridan-to'g'ri MP4 havolalarini vebda sinxron ko'rish xizmati. iOS va Android ilovalari ishlab chiqilmoqda.",
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'Web',
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
            text: "WeWatch'ni brauzerda oching, YouTube, VK yoki Rutube'dan video toping, xona yarating va do'stingizga havola yuboring. Mobil ilovalar ishlab chiqilmoqda.",
          },
        },
        {
          '@type': 'Question',
          name: "Birga kino ko'rish bepulmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "WeWatch'ning asosiy funksiyalari veb-versiyada bepul. iOS va Android ilovalari ishlab chiqilmoqda.",
          },
        },
        {
          '@type': 'Question',
          name: "Videoni birga qanday ko'rish mumkin?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "YouTube, VK Video, Rutube yoki to'g'ridan-to'g'ri MP4 havolasini kiriting, xona yarating va havolani ulashing — hamma sinxron ko'radi.",
          },
        },
        {
          '@type': 'Question',
          name: "Anime yoki serialni birga ko'rish mumkinmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha, anime yoki serial YouTube, VK Video, Rutube yoxud to'g'ridan-to'g'ri MP4 havolasi orqali mavjud bo'lsa, xona yaratib uni do'stingiz bilan sinxron ko'rishingiz mumkin.",
          },
        },
        {
          '@type': 'Question',
          name: "Biri telefonda, biri saytda bo'lsa birga ko'rish mumkinmi?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Ha — WeWatch veb-versiyasini iPhone, Android va kompyuter brauzerida ochib, bitta sinxron xonada ishlatish mumkin. Mobil ilovalar ishlab chiqilmoqda.",
          },
        },
      ],
    },
  ],
};

const publishedJsonLd = publishHomepageSchema(jsonLd, 'uz');

export default function UzHomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(publishedJsonLd) }}
      />
      <div className="brand-fonts">
        <LandingContent locale="uz" />
      </div>
    </>
  );
}
