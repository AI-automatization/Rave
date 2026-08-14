import { RootDocument, siteMetadata, siteViewport } from '@/components/common/RootDocument';

// No `alternates` here on purpose. hreflang is per-page — every page under /en
// declares its own set. A layout-level block is inherited by every child, so
// /en/faq would have advertised /en as its Russian and English counterpart,
// which is a wrong tag rather than a missing one.

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
