import type { Metadata } from 'next';
import { SOCIAL_PROFILE_URLS, SUPPORT_EMAIL } from '@/data/brand';
import { ContactContent } from '@/components/landing/ContactContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "Aloqa — WeWatch va tezcode.dev | Bizga yozing" },
  description:
    "WeWatch jamoasi bilan bog'laning: email support@wewatch.uz, Telegram, Instagram, X. Savol, hamkorlik yoki g'oya — biz aloqadamiz.",
  alternates: {
    canonical: `${APP_URL}/uz/contact`,
    languages: hreflangFor('/ru/contact', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'Aloqa — WeWatch va tezcode.dev',
    description: "WeWatch jamoasiga yozing — email, Telegram, Instagram, X.",
    url: `${APP_URL}/uz/contact`,
  }),
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'WeWatch aloqa',
  url: `${APP_URL}/uz/contact`,
  inLanguage: 'uz',
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

export default function UzContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ContactContent />
    </>
  );
}
