import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Privacy Policy — CineSync',
  description: 'CineSync Privacy Policy and DMCA information.',
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-zinc-300">
      {/* Simple nav */}
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7B72F8] flex items-center justify-center">
              <FaPlay size={9} className="text-white ml-0.5" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              CINE<span className="text-[#7B72F8]">SYNC</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-12">
          Last updated: May 14, 2026 &nbsp;·&nbsp; Effective: May 14, 2026
        </p>

        <div className="bg-[#111118] border-l-4 border-[#7B72F8] rounded-r-xl px-6 py-5 mb-10 text-zinc-400">
          Rave (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the CineSync mobile application and
          related services. This Privacy Policy explains what information we collect, how we use it,
          and your rights.
        </div>

        <Section title="1. Information We Collect">
          <ul>
            <li><strong className="text-zinc-200">Account data</strong> — email address, username, password hash (bcrypt), profile photo</li>
            <li><strong className="text-zinc-200">OAuth data</strong> — Google/Telegram profile ID and display name when you sign in via OAuth</li>
            <li><strong className="text-zinc-200">Usage data</strong> — watch history, watch party sessions, battle participation, points and rank</li>
            <li><strong className="text-zinc-200">Device data</strong> — device type, OS version, Expo push token for notifications</li>
            <li><strong className="text-zinc-200">Technical logs</strong> — IP address, request timestamps, error reports (for debugging)</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>Provide, maintain, and improve the CineSync service</li>
            <li>Authenticate your account and keep sessions secure</li>
            <li>Send push notifications you have opted into</li>
            <li>Calculate rankings, achievements, and gamification rewards</li>
            <li>Detect and prevent abuse, fraud, and policy violations</li>
            <li>Respond to support requests</li>
          </ul>
        </Section>

        <Section title="3. Information We Do Not Collect">
          <ul>
            <li>We do not collect payment or financial information</li>
            <li>We do not sell your personal data to third parties</li>
            <li>We do not use your data for advertising profiling</li>
          </ul>
        </Section>

        <Section title="4. Data Sharing">
          <p className="mb-3">We share data only with:</p>
          <ul>
            <li><strong className="text-zinc-200">MongoDB Atlas</strong> — database hosting (data processed in the US)</li>
            <li><strong className="text-zinc-200">Railway.app</strong> — server infrastructure</li>
            <li><strong className="text-zinc-200">Google Firebase</strong> — push notification delivery</li>
            <li><strong className="text-zinc-200">Telegram</strong> — Telegram OAuth and bot integration</li>
            <li>Law enforcement when required by applicable law</li>
          </ul>
        </Section>

        <Section title="5. Data Retention">
          <ul>
            <li>Active accounts: retained for the lifetime of the account</li>
            <li>Deleted accounts: personal data removed within 30 days of deletion request</li>
            <li>Access logs: retained for 90 days for security purposes</li>
          </ul>
        </Section>

        <Section title="6. Your Rights">
          <p className="mb-3">You have the right to:</p>
          <ul>
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent for optional data processing</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, contact us at{' '}
            <a href="mailto:privacy@wewatch.app" className="text-[#7B72F8] hover:underline">
              privacy@wewatch.app
            </a>.
          </p>
        </Section>

        <Section title="7. Security">
          <p>
            We protect your data using industry-standard measures: bcrypt password hashing,
            RS256 JWT tokens with short expiry, Redis-backed rate limiting, TLS in transit,
            and MongoDB Atlas encryption at rest.
          </p>
        </Section>

        <Section title="8. Children&apos;s Privacy">
          <p>
            CineSync is not directed to children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us personal
            information, contact us at{' '}
            <a href="mailto:privacy@wewatch.app" className="text-[#7B72F8] hover:underline">
              privacy@wewatch.app
            </a>.
          </p>
        </Section>

        <Section title="9. Changes to This Policy">
          <p>
            We may update this policy periodically. We will notify you of material changes via
            the app or email. Continued use after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="10. DMCA / Copyright">
          <p className="mb-3">
            CineSync allows users to share links to publicly available video content. We do not
            host video files. If you believe content linked through our service infringes your
            copyright, contact us at{' '}
            <a href="mailto:copyright@wewatch.app" className="text-[#7B72F8] hover:underline">
              copyright@wewatch.app
            </a>{' '}
            with:
          </p>
          <ul>
            <li>Identification of the copyrighted work</li>
            <li>Identification of the infringing link</li>
            <li>Your contact information</li>
            <li>A statement of good faith belief that the use is not authorized</li>
          </ul>
          <p className="mt-4">We will review and respond within 5 business days.</p>
        </Section>

        <Section title="11. Contact">
          <p className="space-y-1">
            <strong className="text-zinc-200 block">CineSync (Rave)</strong>
            Privacy:{' '}
            <a href="mailto:privacy@wewatch.app" className="text-[#7B72F8] hover:underline">
              privacy@wewatch.app
            </a>
            <br />
            Copyright:{' '}
            <a href="mailto:copyright@wewatch.app" className="text-[#7B72F8] hover:underline">
              copyright@wewatch.app
            </a>
          </p>
        </Section>
      </main>

      <footer className="border-t border-zinc-800/60 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} CineSync. All rights reserved.</p>
          <Link href="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      <div className="text-zinc-400 text-sm leading-7 space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
