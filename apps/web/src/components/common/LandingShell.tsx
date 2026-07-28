import { LandingNav } from '@/components/common/LandingNav';
import { Footer } from '@/components/common/Footer';

/**
 * Chrome around the marketing pages — nav, content, footer.
 *
 * Extracted because the same shell is now needed three times: once at the root
 * for Russian, and once under each of /uz and /en. Keeping it in one file means
 * a nav or footer change cannot land in one language and be forgotten in the
 * other two.
 */
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0F]">
      <LandingNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
