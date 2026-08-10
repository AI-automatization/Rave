import { RootDocument, siteMetadata, siteViewport } from '@/components/common/RootDocument';

// No layout-level alternates: hreflang is page-specific. Inheriting the old
// home-page pair here made every nested URL (for example /uz/faq) advertise the
// locale roots as its translations, and still pointed Russian at the obsolete
// unprefixed URL. Each indexable page uses hreflangFor() instead.

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function UzLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="uz">{children}</RootDocument>;
}
