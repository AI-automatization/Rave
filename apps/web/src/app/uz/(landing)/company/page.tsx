import type { Metadata } from 'next';
import { CompanyContent } from '@/components/landing/CompanyContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "Kompaniya haqida — tezcode.dev, WeWatch ortidagi studiya | Toshkent" },
  description:
    "WeWatch'ni tezcode.dev yaratgan — Toshkentdagi AI Software Factory. 16 kishi, 8 mahsulot: AI Office, RAOS, CoreMed, WeWatch va boshqalar.",
  alternates: {
    canonical: `${APP_URL}/uz/company`,
    languages: hreflangFor('/ru/company', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'Kompaniya haqida — tezcode.dev',
    description: "tezcode.dev — Toshkentdagi AI Software Factory. WeWatch bizning mahsulotlarimizdan biri.",
    url: `${APP_URL}/uz/company`,
  }),
  robots: { index: true, follow: true },
};

export default function UzCompanyPage() {
  return <CompanyContent />;
}
