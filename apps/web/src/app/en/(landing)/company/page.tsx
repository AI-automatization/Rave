import type { Metadata } from 'next';
import { CompanyContent } from '@/app/(landing)/company/CompanyContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'Company — tezcode.dev, the Studio Behind WeWatch | Tashkent' },
  description:
    'WeWatch is built by tezcode.dev — an AI Software Factory from Tashkent. 16 people, 8 products: AI Office, RAOS, CoreMed, WeWatch and more.',
  alternates: {
    canonical: `${APP_URL}/en/company`,
    languages: hreflangFor('/company', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'Company — tezcode.dev',
    description: 'tezcode.dev — an AI Software Factory from Tashkent. WeWatch is one of our products.',
    url: `${APP_URL}/en/company`,
  }),
  robots: { index: true, follow: true },
};

export default function EnCompanyPage() {
  return <CompanyContent />;
}
