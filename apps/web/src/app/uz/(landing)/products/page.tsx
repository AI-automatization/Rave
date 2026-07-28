import type { Metadata } from 'next';
import { ProductsContent } from '@/app/(landing)/products/ProductsContent';
import { hreflangFor } from '@/lib/i18n/routes';
import { socialMeta } from '@/lib/i18n/metadata';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: "tezcode.dev mahsulotlari — AI Office, RAOS, CoreMed, WeWatch" },
  description:
    "tezcode.dev'ning sakkiz mahsuloti: AI Office, RAOS, CoreMed, WorkControl, AI-Trade, WeWatch, Ventra, Savdo-Builder. Toshkentdan biznes uchun AI yechimlari.",
  alternates: {
    canonical: `${APP_URL}/uz/products`,
    languages: hreflangFor('/products', APP_URL),
  },
  ...socialMeta({
    locale: 'uz',
    title: 'tezcode.dev mahsulotlari',
    description: "8 mahsulotdan iborat ekotizim — biznes uchun AI'dan do'stlar uchun WeWatch'gacha.",
    url: `${APP_URL}/uz/products`,
  }),
  robots: { index: true, follow: true },
};

export default function UzProductsPage() {
  return <ProductsContent />;
}
