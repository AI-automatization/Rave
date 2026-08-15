import { RootDocument, siteMetadata, siteViewport } from '@/components/common/RootDocument';
import { SiteShell } from '@/components/common/SiteShell';

// Russian used to live at the root without a prefix. It now has its own prefix
// like every other language, so all three are addressed the same way and no
// language is a special case of the routing. `/` 301s here (next.config.mjs).
//
// No `alternates` block: hreflang is per-page, and a layout-level one would be
// inherited by every child — see the note in app/en/layout.tsx.
export const metadata = siteMetadata;
export const viewport = siteViewport;

// The nav and footer live here rather than in each page: every page under /ru
// gets the same chrome, and a new one cannot be shipped without it.
export default function RuLayout({ children }: { children: React.ReactNode }) {
  return (
    <RootDocument locale="ru">
      <SiteShell>{children}</SiteShell>
    </RootDocument>
  );
}
