import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

/**
 * The one chrome every public page wears — nav, page content, footer.
 *
 * It replaces `LandingShell`, which only wrapped the six marketing pages under
 * `(landing)`. Everything else grew its own header: guides, FAQ, how-it-works
 * and the use cases rendered `GuideHeader`, the legal pages hand-rolled a third
 * variant inline, and `/ru/use-cases`, `/ru/team` and `/ru/tezcode` had no
 * header at all. Four headers on one site, and a page reachable from search
 * with no way back to the product.
 *
 * The shell deliberately renders no `<main>`: it sits in the locale layout, and
 * the pages below it already carry their own (the `(landing)` group is the one
 * exception and supplies it in its own layout). A `<main>` here would nest
 * inside theirs, which is invalid and breaks the "skip to content" landmark.
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-page">
      <LandingNav />
      {children}
      <Footer />
    </div>
  );
}
