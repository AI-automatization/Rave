import type { Metadata } from 'next';
import { SOCIAL_PROFILE_URLS, SUPPORT_EMAIL } from '@/data/brand';
import { ContactContent } from '@/components/landing/ContactContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'Contact — WeWatch and tezcode.dev | Get in Touch' },
  description:
    'Reach the WeWatch team: email support@wewatch.uz, Telegram, Instagram, X. Questions, partnerships or ideas — we are listening.',
  alternates: {
    canonical: `${APP_URL}/en/contact`,
    languages: hreflangFor('/ru/contact', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'Contact — WeWatch and tezcode.dev',
    description: 'Write to the WeWatch team — email, Telegram, Instagram, X.',
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
  // The page lists WeWatch's own channels, so the entity it describes is WeWatch —
  // tezcode stays as the parent organization rather than the contact itself.
  mainEntity: {
    '@type': 'Organization',
    name: 'WeWatch',
    email: SUPPORT_EMAIL,
    url: APP_URL,
    sameAs: SOCIAL_PROFILE_URLS,
    parentOrganization: {
      '@type': 'Organization',
      name: 'tezcode',
      url: 'https://www.tezcode.dev/',
    },
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
