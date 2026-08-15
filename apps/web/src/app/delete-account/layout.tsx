import { RootDocument, siteMetadata, siteViewport } from '@/components/common/RootDocument';
import { SiteShell } from '@/components/common/SiteShell';

export const metadata = siteMetadata;
export const viewport = siteViewport;

// The legal pages sit outside the locale trees (one English copy serves all
// three), so they need the shell wired up here — they used to hand-roll a
// header and footer of their own inside the page instead.
export default function DeleteAccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument locale="en">
      <SiteShell>{children}</SiteShell>
    </RootDocument>
  );
}
