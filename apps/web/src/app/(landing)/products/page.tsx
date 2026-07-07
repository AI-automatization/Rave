import type { Metadata } from 'next';
import { ProductsContent } from './ProductsContent';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wewatch.uz';

export const metadata: Metadata = {
  title: { absolute: 'Продукты tezcode.dev — AI Office, RAOS, CoreMed, WeWatch и другие' },
  description:
    'Восемь продуктов tezcode.dev: AI Office, RAOS, CoreMed, WorkControl, AI-Trade, WeWatch, Ventra, Savdo-Builder. AI-решения для бизнеса и людей из Ташкента.',
  alternates: { canonical: `${APP_URL}/products` },
  openGraph: {
    title: 'Продукты tezcode.dev',
    description: 'Экосистема из 8 продуктов — от AI для бизнеса до WeWatch для друзей.',
    url: `${APP_URL}/products`,
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Продукты tezcode.dev',
  itemListElement: [
    'AI Office', 'RAOS', 'CoreMed', 'WorkControl', 'AI-Trade', 'WeWatch', 'Ventra', 'Savdo-Builder',
  ].map((name, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name,
  })),
};

export default function ProductsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductsContent />
    </>
  );
}
