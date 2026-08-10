import type { Metadata } from 'next';
import { AboutContent } from '@/components/landing/AboutContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'About WeWatch — Watch Videos Together Online' },
  description:
    'WeWatch is a web service for watching YouTube, VK and Rutube together with friends online. Native iOS and Android apps are in development.',
  alternates: {
    canonical: `${APP_URL}/en/about`,
    languages: hreflangFor('/ru/about', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'About WeWatch',
    description: 'WeWatch — a free web watch party. Native iOS and Android apps are in development.',
    url: `${APP_URL}/en/about`,
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${APP_URL}/en/about`,
  url: `${APP_URL}/en/about`,
  name: 'About WeWatch',
  inLanguage: 'en',
  about: {
    '@type': 'SoftwareApplication',
    name: 'WeWatch',
    url: APP_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: {
      '@type': 'Organization',
      name: 'tezcode.dev',
      url: 'https://www.tezcode.dev/',
    },
  },
};

export default function EnAboutPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AboutContent />
    </>
  );
}
