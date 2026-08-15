import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DMCA Policy',
  description: 'WeWatch DMCA / Copyright Policy — how to report copyright infringement and our takedown process.',
  alternates: { canonical: 'https://wewatch.uz/dmca' },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'May 20, 2026';
const COMPANY = 'WeWatch (Rave)';
const DMCA_EMAIL = 'copyright@wewatch.app';
const SUPPORT_EMAIL = 'support@wewatch.app';

export default function DmcaPage() {
  return (
    <div className="flex-1 bg-page text-zinc-300">
      <main className="article max-w-4xl mx-auto px-6 py-16">
        <nav aria-label="Breadcrumb" className="text-zinc-400 text-xs mb-6">
          <Link href="/en" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">DMCA</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">DMCA &amp; Copyright Policy</h1>
        <p className="text-zinc-400 text-sm mb-12">
          Last updated: {EFFECTIVE_DATE}
        </p>

        <div className="bg-[#111118] border-l-4 border-[#7B72F8] rounded-r-xl px-6 py-5 mb-10 text-zinc-400 text-sm leading-7">
          <strong className="text-zinc-200 block mb-1">Our Position on Copyright</strong>
          {COMPANY} (&quot;WeWatch&quot;) respects intellectual property rights and complies with the
          Digital Millennium Copyright Act (DMCA), 17 U.S.C. § 512, and equivalent copyright laws
          in other jurisdictions. WeWatch operates an <strong className="text-zinc-200">in-app browser
          with social watch party coordination</strong> — we do not host, store, proxy, or distribute
          video content. Video data travels directly from source websites to users&apos; devices; our
          servers only store URLs (references), not the video content itself. This policy explains
          how we handle copyright concerns related to our platform.
        </div>

        <Section title="1. How WeWatch Handles Video Content">
          <p className="mb-3">
            WeWatch is fundamentally different from file-sharing or video hosting services:
          </p>
          <ul>
            <li>
              <strong className="text-zinc-200">No content hosting</strong> — WeWatch does not upload,
              store, cache, or reproduce video files on its servers. Video content remains exclusively
              on the original source servers.
            </li>
            <li>
              <strong className="text-zinc-200">URL-based access</strong> — Users share URLs pointing
              to externally hosted content. WeWatch facilitates synchronized playback of content the
              user accesses directly from the source.
            </li>
            <li>
              <strong className="text-zinc-200">Playback coordination only</strong> — WeWatch transmits
              playback control signals (play, pause, timestamp) between users in a room. It does not
              transmit video data between users or servers.
            </li>
            <li>
              <strong className="text-zinc-200">Stream URL resolution</strong> — For technical playback
              compatibility, our backend may resolve a URL to its underlying HLS/MPEG-DASH stream URL.
              This is analogous to a browser resolving a webpage&apos;s media element — no copy is made.
            </li>
          </ul>
          <p className="mt-3">
            <strong className="text-zinc-200">For takedowns of content at its source</strong>, you must
            contact the platform that actually hosts the video (YouTube, Vimeo, etc.). WeWatch cannot
            remove content from third-party platforms.
          </p>
        </Section>

        <Section title="2. What WeWatch CAN Remove">
          <p className="mb-3">
            While we do not host video content, WeWatch can:
          </p>
          <ul>
            <li>Block specific video URLs from being shared or played within our Service</li>
            <li>Block specific domains from being used within our Service</li>
            <li>Terminate accounts of repeat infringers</li>
            <li>Disable watch party rooms that are being used to facilitate infringement</li>
          </ul>
        </Section>

        <Section title="3. Filing a DMCA Takedown Notice">
          <p className="mb-3">
            If you are a copyright owner (or authorized to act on their behalf) and believe that
            a URL shared through WeWatch&apos;s Service infringes your copyright, you may submit a
            takedown notice to our designated copyright agent.
          </p>

          <div className="bg-[#0D0D14] border border-zinc-800 rounded-xl p-5 my-4">
            <p className="text-zinc-200 font-medium mb-2">Designated Copyright Agent</p>
            <p className="text-zinc-400">
              {COMPANY}<br />
              Email: <a href={`mailto:${DMCA_EMAIL}`} className="text-[#7B72F8] hover:underline">{DMCA_EMAIL}</a><br />
              Subject line: <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">DMCA Takedown Notice</span>
            </p>
          </div>

          <SubHeading>3.1 Required Elements (17 U.S.C. § 512(c)(3))</SubHeading>
          <p className="mb-2">Your notice must include ALL of the following:</p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>
              <strong className="text-zinc-200">Identification of the copyrighted work</strong> — describe
              the copyrighted work you claim has been infringed (e.g., film title, song name, written work).
            </li>
            <li>
              <strong className="text-zinc-200">Identification of the infringing material</strong> — the
              specific URL(s) shared within WeWatch that you claim are infringing, with sufficient detail
              for us to locate the material.
            </li>
            <li>
              <strong className="text-zinc-200">Your contact information</strong> — your name, mailing
              address, telephone number, and email address.
            </li>
            <li>
              <strong className="text-zinc-200">Good faith statement</strong> — a statement that you
              have a good faith belief that the use is not authorized by the copyright owner, its agent,
              or the law.
            </li>
            <li>
              <strong className="text-zinc-200">Accuracy statement</strong> — a statement, under penalty
              of perjury, that the information in your notice is accurate and that you are authorized
              to act on behalf of the copyright owner.
            </li>
            <li>
              <strong className="text-zinc-200">Signature</strong> — your physical or electronic
              signature (your full legal name in the email is sufficient).
            </li>
          </ol>

          <SubHeading>3.2 Response Timeline</SubHeading>
          <ul>
            <li>We will acknowledge receipt of valid notices within <strong className="text-zinc-200">3 business days</strong></li>
            <li>We will act on valid notices (block the URL) within <strong className="text-zinc-200">5 business days</strong></li>
            <li>We will notify the user who shared the URL that a takedown notice was received</li>
          </ul>

          <p className="mt-3 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/20 rounded-lg p-3">
            ⚠️ Warning: Submitting a fraudulent or materially misrepresenting DMCA notice may expose
            you to civil liability under 17 U.S.C. § 512(f). Only submit a notice if you are
            the copyright owner or authorized to act on their behalf.
          </p>
        </Section>

        <Section title="4. Counter-Notification Process">
          <p className="mb-3">
            If you believe content was removed in error (e.g., you have a license, or your use
            qualifies as fair use), you may submit a counter-notification.
          </p>

          <SubHeading>4.1 Counter-Notice Requirements</SubHeading>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Your name, address, telephone number, and email address</li>
            <li>Identification of the material removed and its location before removal</li>
            <li>
              A statement under penalty of perjury that you have a good faith belief the material
              was removed due to mistake or misidentification
            </li>
            <li>
              A statement that you consent to jurisdiction of the Federal District Court for your
              district (or, if outside the US, any judicial district in which WeWatch may be found)
              and will accept service of process from the original complainant
            </li>
            <li>Your physical or electronic signature</li>
          </ol>

          <p className="mt-3">
            Send counter-notifications to:{' '}
            <a href={`mailto:${DMCA_EMAIL}`} className="text-[#7B72F8] hover:underline">{DMCA_EMAIL}</a>{' '}
            with subject line{' '}
            <span className="font-mono bg-zinc-800 px-2 py-0.5 rounded text-xs">DMCA Counter-Notice</span>.
          </p>
          <p className="mt-2">
            Upon receiving a valid counter-notification, we will forward it to the original
            complainant. If no court action is filed within 10–14 business days, we may restore
            access to the blocked URL.
          </p>
        </Section>

        <Section title="5. Repeat Infringer Policy">
          <p>
            WeWatch maintains a policy of terminating accounts of users who are found to be repeat
            copyright infringers. A user who receives multiple valid DMCA notices will have their
            account suspended or permanently banned. We track all valid takedown notices and may
            act on patterns of infringing behavior even before a formal takedown threshold is reached.
          </p>
        </Section>

        <Section title="6. Safe Harbor">
          <p className="mb-3">
            WeWatch qualifies for safe harbor protection under the Digital Millennium Copyright Act
            on two grounds:
          </p>
          <ul>
            <li>
              <strong className="text-zinc-200">17 U.S.C. § 512(d) — Information Location Tools.</strong>{' '}
              WeWatch&apos;s primary function is to refer users to content located on third-party servers
              via URLs. We do not have actual knowledge of infringing activity; upon obtaining such
              knowledge, we act expeditiously to block the infringing URL within our Service.
            </li>
            <li>
              <strong className="text-zinc-200">17 U.S.C. § 512(c) — Storage at User Direction.</strong>{' '}
              To the extent WeWatch stores watch party room data (including URLs) at the direction
              of users, we qualify for storage safe harbor. We do not financially benefit directly
              from infringing activity, and we respond expeditiously to valid DMCA takedown notices.
            </li>
          </ul>
          <p className="mt-3">
            WeWatch does not exercise editorial control over user-submitted URLs. We do not receive
            a direct financial benefit attributable to infringing activity. We have designated a
            copyright agent and maintain a repeat infringer policy, as required by § 512(i).
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Note: Because WeWatch does not host, store, or proxy video content — it only stores
            URLs pointing to externally hosted content — copyright takedown actions must ultimately
            be directed to the platform hosting the video (YouTube, Vimeo, etc.) to achieve full
            removal. WeWatch can block the URL within our Service; we cannot remove content from
            third-party platforms.
          </p>
        </Section>

        <Section title="7. Non-US Copyright Claims">
          <p>
            WeWatch accepts copyright infringement notices from rights holders worldwide, not just
            from the US. If you are located outside the US, please reference your local copyright
            law in your notice. We will evaluate the notice in good faith under applicable law.
          </p>
          <ul>
            <li><strong className="text-zinc-200">EU/EEA</strong> — rights holders may assert claims under the EU Copyright Directive (2019/790)</li>
            <li><strong className="text-zinc-200">UK</strong> — rights holders may assert claims under the Copyright, Designs and Patents Act 1988</li>
            <li><strong className="text-zinc-200">Other jurisdictions</strong> — we review notices on a case-by-case basis</li>
          </ul>
        </Section>

        <Section title="8. Good Faith Principles">
          <p>
            WeWatch is committed to operating in good faith with respect to intellectual property.
            We encourage users to only share links to content they have a right to access, and we
            take copyright enforcement seriously. At the same time, we recognize that not all uses
            of copyrighted material are infringing — fair use, fair dealing, commentary, education,
            and other exceptions may apply. We will consider these factors when evaluating notices.
          </p>
        </Section>

        <Section title="9. Contact">
          <div className="space-y-1">
            <strong className="text-zinc-200 block">{COMPANY}</strong>
            <p>DMCA / Copyright: <a href={`mailto:${DMCA_EMAIL}`} className="text-[#7B72F8] hover:underline">{DMCA_EMAIL}</a></p>
            <p>General support: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B72F8] hover:underline">{SUPPORT_EMAIL}</a></p>
            <p className="mt-3">
              Related policies:{' '}
              <Link href="/privacy-policy" className="text-[#7B72F8] hover:underline">Privacy Policy</Link>
              {' '}·{' '}
              <Link href="/terms" className="text-[#7B72F8] hover:underline">Terms of Service</Link>
            </p>
          </div>
        </Section>
      </main>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-zinc-800">{title}</h2>
      <div className="text-zinc-400 text-sm leading-7 space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ol]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-zinc-200 font-medium mt-4 mb-2">{children}</h3>;
}
