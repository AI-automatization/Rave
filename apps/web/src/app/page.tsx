import type { Metadata } from 'next';
import { LandingContent } from './LandingContent';

export const metadata: Metadata = {
  title: "CineSync — Do'stlar bilan birga film ko'ring",
  description:
    "Ijtimoiy onlayn kinoteatr platformasi. Do'stlar bilan sinxron film ko'rish, battle va achievement tizimi.",
  openGraph: {
    title: "CineSync — Do'stlar bilan birga film ko'ring",
    description: "Ijtimoiy onlayn kinoteatr platformasi.",
    images: [{ url: '/og-home.jpg', width: 1200, height: 630 }],
  },
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'CineSync',
            url: 'https://cinesync.uz',
            description: 'Ijtimoiy onlayn kinoteatr platformasi',
          }),
        }}
      />
      <LandingContent />
    </>
  );
}
