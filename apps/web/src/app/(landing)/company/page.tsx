import type { Metadata } from 'next';
import { CompanyContent } from './CompanyContent';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';
const TEZCODE_URL = 'https://www.tezcode.dev/';

export const metadata: Metadata = {
  title: { absolute: 'О компании — tezcode.dev, студия за WeWatch | AI Software Factory, Ташкент' },
  description:
    'WeWatch создан tezcode.dev — AI Software Factory из Ташкента. 16 человек, 8 продуктов: AI Office, RAOS, CoreMed, WeWatch и другие. Автоматизируем бизнес с помощью AI.',
  alternates: {
    canonical: `${APP_URL}/company`,
    languages: hreflangFor('/company', APP_URL),
  },
  openGraph: {
    title: 'О компании — tezcode.dev',
    description: 'tezcode.dev — AI Software Factory из Ташкента. WeWatch — один из наших продуктов.',
    url: `${APP_URL}/company`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://www.tezcode.dev/#organization',
  name: 'tezcode.dev',
  alternateName: ['tezcode', 'tezcode.dev', 'TezCode'],
  url: TEZCODE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${APP_URL}/icons/icon-512x512.png`,
    width: 512,
    height: 512,
  },
  slogan: 'Har biznesni AI bilan avtomatlashtiramiz',
  description:
    'tezcode.dev — AI Software Factory из Ташкента, Узбекистан. Создаёт AI-продукты для бизнеса и людей: AI Office, RAOS, CoreMed, WorkControl, AI-Trade, WeWatch и другие.',
  foundingLocation: {
    '@type': 'Place',
    name: 'Ташкент, Узбекистан',
  },
  areaServed: ['UZ', 'RU', 'KZ'],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'tezcode@tezcode.dev',
  },
  sameAs: [
    TEZCODE_URL,
    'https://t.me/webdevelopertk',
    'https://instagram.com/tezcode_dev',
  ],
  makesOffer: {
    '@type': 'Offer',
    itemOffered: {
      '@type': 'MobileApplication',
      name: 'WeWatch',
      url: APP_URL,
      applicationCategory: 'EntertainmentApplication',
      operatingSystem: 'iOS, Android',
    },
  },
};

export default function CompanyPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CompanyContent />
    </>
  );
}
