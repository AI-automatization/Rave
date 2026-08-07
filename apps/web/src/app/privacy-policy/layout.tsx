import { RootDocument, siteMetadata, siteViewport } from '@/components/common/RootDocument';

export const metadata = siteMetadata;
export const viewport = siteViewport;

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
