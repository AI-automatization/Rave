import type { Metadata } from 'next';
import { SOCIAL_PROFILE_URLS, SUPPORT_EMAIL } from '@/data/brand';
import { ContactContent } from '@/components/landing/ContactContent';
import { hreflangFor } from '@/lib/i18n/routes';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'Контакты — WeWatch и tezcode.dev | Написать нам' },
  description:
    'Свяжитесь с командой WeWatch: почта support@wewatch.uz, Telegram, Instagram, X. Вопросы, сотрудничество или идеи — мы на связи.',
  alternates: {
    canonical: `${APP_URL}/ru/contact`,
    languages: hreflangFor('/ru/contact', APP_URL),
  },
  openGraph: {
    title: 'Контакты — WeWatch и tezcode.dev',
    description: 'Напишите команде WeWatch — почта, Telegram, Instagram, X.',
    url: `${APP_URL}/ru/contact`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Контакты WeWatch',
  url: `${APP_URL}/ru/contact`,
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

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactContent />
    </>
  );
}
