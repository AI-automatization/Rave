import type { Metadata } from 'next';
import { ProductsContent } from '@/components/landing/ProductsContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'tezcode.dev Products — AI Office, RAOS, CoreMed, WeWatch' },
  description:
    'Eight products by tezcode.dev: AI Office, RAOS, CoreMed, WorkControl, AI-Trade, WeWatch, Ventra, Savdo-Builder. AI solutions from Tashkent.',
  alternates: {
    canonical: `${APP_URL}/en/products`,
    languages: hreflangFor('/ru/products', APP_URL),
  },
  ...socialMeta({
    locale: 'en',
    title: 'tezcode.dev Products',
    description: 'An ecosystem of 8 products — from AI for business to WeWatch for friends.',
    url: `${APP_URL}/en/products`,
  }),
  robots: { index: true, follow: true },
};

export default function EnProductsPage() {
  return <ProductsContent />;
}
