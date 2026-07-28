import type { Metadata } from 'next';
import { ContactContent } from '@/components/landing/ContactContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "Aloqa — WeWatch va tezcode.dev | Bizga yozing" },
  description:
    "WeWatch va tezcode.dev jamoasi bilan bog'laning: email tezcode@tezcode.dev, Telegram, Instagram. Savol, hamkorlik yoki g'oya — biz aloqadamiz.",
  alternates: {
    canonical: `${APP_URL}/uz/contact`,
    languages: hreflangFor('/ru/contact', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'Aloqa — WeWatch va tezcode.dev',
    description: "WeWatch va tezcode.dev jamoasiga yozing — email, Telegram, Instagram.",
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
  mainEntity: {
    '@type': 'Organization',
    name: 'tezcode.dev',
    email: 'tezcode@tezcode.dev',
    url: 'https://www.tezcode.dev/',
    sameAs: ['https://t.me/webdevelopertk', 'https://instagram.com/tezcode_dev'],
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
