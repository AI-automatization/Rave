import { LocaleBoundary } from '@/components/common/LocaleBoundary';

// Russian used to live at the root without a prefix. It now has its own prefix
// like every other language, so all three are addressed the same way and no
// language is a special case of the routing. `/` 301s here (next.config.mjs).
//
// No `alternates` block: hreflang is per-page, and a layout-level one would be
// inherited by every child — see the note in app/en/layout.tsx.
export default function RuLayout({ children }: { children: React.ReactNode }) {
  return <LocaleBoundary locale="ru">{children}</LocaleBoundary>;
}
