import type { Metadata } from 'next';
import { AboutContent } from '@/app/(landing)/about/AboutContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'About WeWatch — Free App for Watching Videos Together' },
  description:
    'WeWatch is a free app for watching YouTube, VK and Rutube together with friends online. iOS, Android and Web. Built by tezcode.dev in Tashkent.',
  alternates: {
    canonical: `${APP_URL}/en/about`,
    languages: hreflangFor('/about', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'About WeWatch',
    description: 'WeWatch — a free watch party for iOS, Android and Web. Watch in sync with friends.',
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
    '@type': 'MobileApplication',
    name: 'WeWatch',
    url: APP_URL,
    applicationCategory: 'EntertainmentApplication',
    operatingSystem: 'iOS, Android',
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
