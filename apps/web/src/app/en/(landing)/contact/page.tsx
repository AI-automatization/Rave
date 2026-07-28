import type { Metadata } from 'next';
import { ContactContent } from '@/app/(landing)/contact/ContactContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'Contact — WeWatch and tezcode.dev | Get in Touch' },
  description:
    'Reach the WeWatch and tezcode.dev team: email tezcode@tezcode.dev, Telegram, Instagram. Questions, partnerships or ideas — we are listening.',
  alternates: {
    canonical: `${APP_URL}/en/contact`,
    languages: hreflangFor('/contact', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'Contact — WeWatch and tezcode.dev',
    description: 'Write to the WeWatch and tezcode.dev team — email, Telegram, Instagram.',
    url: `${APP_URL}/en/contact`,
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact WeWatch',
  url: `${APP_URL}/en/contact`,
  inLanguage: 'en',
  mainEntity: {
    '@type': 'Organization',
    name: 'tezcode.dev',
    email: 'tezcode@tezcode.dev',
    url: 'https://www.tezcode.dev/',
    sameAs: ['https://t.me/webdevelopertk', 'https://instagram.com/tezcode_dev'],
  },
};

export default function EnContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactContent />
    </>
  );
}
