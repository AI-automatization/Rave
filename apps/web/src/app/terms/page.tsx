import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'WeWatch Terms of Service — rules and guidelines for using the WeWatch platform.',
  alternates: { canonical: 'https://wewatch.uz/terms' },
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'May 20, 2026';
const COMPANY = 'WeWatch (Rave)';
const SUPPORT_EMAIL = 'support@wewatch.uz';
const LEGAL_EMAIL = 'legal@wewatch.uz';
const APP_URL = 'https://wewatch.uz';

export default function TermsPage() {
  return (
    <div className="flex-1 bg-page text-zinc-300">
      <main className="article max-w-4xl mx-auto px-6 py-16">
        <nav aria-label="Breadcrumb" className="text-zinc-400 text-xs mb-6">
          <Link href="/en" className="hover:text-zinc-400 transition-colors">WeWatch</Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-400">Terms of Service</span>
        </nav>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Terms of Service</h1>
        <p className="text-zinc-400 text-sm mb-12">
          Last updated: {EFFECTIVE_DATE} &nbsp;·&nbsp; Effective: {EFFECTIVE_DATE}
        </p>

        <div className="bg-[#111118] border-l-4 border-[#7B72F8] rounded-r-xl px-6 py-5 mb-10 text-zinc-400 text-sm leading-7">
          <strong className="text-zinc-200 block mb-1">Please Read Carefully</strong>
          These Terms of Service (&quot;Terms&quot;) constitute a legally binding agreement between you
          and <strong className="text-zinc-200">{COMPANY}</strong> (&quot;WeWatch&quot;, &quot;we&quot;,
          &quot;our&quot;, &quot;us&quot;) governing your use of the WeWatch website ({APP_URL}) and all
          related services (collectively, the &quot;Service&quot;). Native iOS and Android applications
          are in development and will become part of the Service only when released.
          By creating an account or using the Service, you agree to be bound by these Terms.
          If you do not agree, do not use the Service.
        </div>

        <Section title="1. Eligibility">
          <ul>
            <li>You must be at least <strong className="text-zinc-200">17 years old</strong> to use the Service due to user-generated content and mature video content that users may share in watch party rooms. Native iOS and Android apps are still in development.</li>
            <li>If you are under 18, you represent that your parent or legal guardian has reviewed and agreed to these Terms on your behalf.</li>
            <li>You must provide accurate, complete, and current information when creating your account.</li>
            <li>You may not create an account if you have previously been banned from the Service.</li>
            <li>The Service is available worldwide, subject to applicable local laws. You are responsible for compliance with your jurisdiction&apos;s laws.</li>
          </ul>
        </Section>

        <Section title="2. Your Account">
          <ul>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>Notify us immediately at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B72F8] hover:underline">{SUPPORT_EMAIL}</a> if you suspect unauthorized access.</li>
            <li>You may not share, transfer, or sell your account to another person.</li>
            <li>You may not create multiple accounts to circumvent bans or restrictions.</li>
          </ul>
        </Section>

        <Section title="3. The Service — Watch Party Platform">
          <p className="mb-3">
            WeWatch provides a social platform enabling users to watch video content simultaneously in
            synchronized &quot;watch party&quot; rooms. The Service functions as a{' '}
            <strong className="text-zinc-200">social coordination and in-app browser layer</strong> —
            we do not own, host, upload, store, or distribute video content.
          </p>

          <SubHeading>3.1 How Video Playback Works</SubHeading>
          <p className="mb-2">The WeWatch video flow has three steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong className="text-zinc-200">User browses via in-app browser.</strong> The app
              contains an integrated web browser (WebView). Users navigate to any website, which
              loads entirely on their device — exactly as in Safari or Chrome. WeWatch does not
              intercept, proxy, or modify the traffic between the user&apos;s device and the website.
            </li>
            <li>
              <strong className="text-zinc-200">Client-side video URL detection.</strong> When the
              in-app browser loads a page containing video, the app detects the media stream URL
              (e.g., HLS manifest) that the browser has already fetched from the source website.
              This detection is local to the user&apos;s device — no network request is made by WeWatch
              servers for this step. No copy of the video is made.
            </li>
            <li>
              <strong className="text-zinc-200">Playback synchronization.</strong> WeWatch transmits
              only playback control signals (play, pause, seek timestamp) between room participants.
              Video data travels directly from the source website&apos;s servers to each user&apos;s device.
              WeWatch servers never receive or retransmit video data.
            </li>
          </ol>

          <SubHeading>3.2 What the Service Does NOT Do</SubHeading>
          <ul>
            <li><strong className="text-zinc-200">Does not download or save video files</strong> to our servers or to users&apos; devices from third-party sources</li>
            <li><strong className="text-zinc-200">Does not circumvent DRM</strong> — content protected by Widevine, FairPlay, or PlayReady cannot be extracted by our method and is not accessible through WeWatch</li>
            <li><strong className="text-zinc-200">Does not proxy video traffic</strong> through WeWatch servers — all video data goes source → user device directly</li>
            <li><strong className="text-zinc-200">Does not provide access to paywalled content</strong> — users must independently have authorization to view content they access via the in-app browser</li>
            <li><strong className="text-zinc-200">Does not reproduce or redistribute</strong> copyrighted video content</li>
          </ul>

          <SubHeading>3.3 Third-Party Website Access</SubHeading>
          <p className="mb-2">
            When users browse third-party websites through the in-app browser:
          </p>
          <ul>
            <li>Users remain solely responsible for complying with the terms of service of any third-party website they visit</li>
            <li>WeWatch has no affiliation with, endorsement of, or control over third-party websites</li>
            <li>WeWatch is not responsible for the content, availability, or practices of any third-party website</li>
            <li>
              <strong className="text-zinc-200">Platform ToS compliance.</strong> Certain platforms
              (e.g., Netflix, Disney+, Hulu) prohibit access through non-approved applications.
              Users are responsible for reviewing and complying with the terms of any platform they
              access. WeWatch does not encourage or facilitate violations of third-party ToS.
            </li>
          </ul>
        </Section>

        <Section title="4. Acceptable Use & Content Policy">
          <SubHeading>4.1 You MAY:</SubHeading>
          <ul>
            <li>Share URLs of videos you have a legal right to access (e.g., content you own, content licensed for personal viewing, Creative Commons content, public domain material)</li>
            <li>Host watch parties for content from platforms that permit watch-along experiences</li>
            <li>Use the Service for personal, non-commercial entertainment</li>
            <li>Interact with other users through chat and reactions in a respectful manner</li>
          </ul>

          <SubHeading>4.2 You MAY NOT:</SubHeading>
          <ul>
            <li>Share links to content that infringes any third party&apos;s copyright, trademark, or other intellectual property rights</li>
            <li>Share, stream, or facilitate access to content you are not lawfully authorized to view or distribute</li>
            <li>Post, stream, or link to any content that is: illegal, pornographic (including CSAM — which will be reported to authorities immediately), hateful, threatening, harassing, or violent</li>
            <li>Impersonate any person, entity, or organization</li>
            <li>Use the Service to spam, phish, or distribute malware</li>
            <li>Attempt to reverse-engineer, decompile, or hack the Service</li>
            <li>Use automated scripts, bots, or scrapers on the Service</li>
            <li>Engage in any activity that disrupts or interferes with the Service</li>
            <li>Attempt to access other users&apos; accounts or data</li>
            <li>Use the Service for any illegal purpose</li>
          </ul>
        </Section>

        <Section title="5. Intellectual Property">
          <SubHeading>5.1 Our Property</SubHeading>
          <p>
            The WeWatch application, logo, design, code, and Service features are owned by {COMPANY}
            and protected by copyright, trademark, and other intellectual property laws. You may not
            copy, modify, distribute, or create derivative works without our written permission.
          </p>

          <SubHeading>5.2 Your Content</SubHeading>
          <p>
            You retain ownership of any content you create (chat messages, profile content). By
            posting content on the Service, you grant us a non-exclusive, worldwide, royalty-free
            license to use, display, and distribute that content solely for the purpose of operating
            and improving the Service. This license terminates when you delete the content or your account.
          </p>

          <SubHeading>5.3 Third-Party Content</SubHeading>
          <p>
            Video content shared via URLs remains the property of its respective owners. WeWatch
            makes no claim over third-party video content. Users are responsible for ensuring
            their use complies with the terms and licenses of the content they access.
          </p>
        </Section>

        <Section title="6. Copyright & DMCA">
          <p className="mb-3">
            WeWatch respects intellectual property rights. If you believe that content linked through
            our Service infringes your copyright, please submit a DMCA takedown notice per our
            <Link href="/dmca" className="text-[#7B72F8] hover:underline ml-1">DMCA Policy</Link>.
          </p>
          <p>
            We respond to valid DMCA notices by disabling access to the infringing URL within our
            Service. Repeat infringers will have their accounts terminated.
          </p>
        </Section>

        <Section title="7. User Reports & Moderation">
          <ul>
            <li>Any user may report inappropriate content or behavior using the in-app reporting feature.</li>
            <li>We investigate all reports and reserve the right to remove content, warn users, restrict access, or permanently ban accounts at our sole discretion.</li>
            <li>Moderation decisions may be appealed by emailing <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B72F8] hover:underline">{SUPPORT_EMAIL}</a>.</li>
            <li>We do not guarantee removal of any specific content but commit to acting on valid reports in a timely manner.</li>
          </ul>
        </Section>

        <Section title="8. Termination">
          <ul>
            <li><strong className="text-zinc-200">By you</strong> — you may delete your account at any time via Settings → Account → Delete Account. Deletion triggers immediate removal of personal data per our Privacy Policy.</li>
            <li><strong className="text-zinc-200">By us</strong> — we may suspend or terminate your account immediately, without notice, if you violate these Terms, engage in illegal activity, or if we cease operating the Service.</li>
            <li>Upon termination, your right to use the Service ends immediately. Sections 5, 9, 10, and 11 survive termination.</li>
          </ul>
        </Section>

        <Section title="9. Disclaimers">
          <p className="mb-3">
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
            EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <ul>
            <li>We do not warrant that the Service will be uninterrupted, error-free, or secure at all times.</li>
            <li>We are not responsible for the content of third-party videos accessible through URLs shared by users.</li>
            <li>We do not warrant that video playback will work for any specific URL or platform.</li>
          </ul>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} AND ITS
            OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
            INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOST PROFITS, DATA
            LOSS, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE. OUR
            TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS SHALL NOT EXCEED USD $100.
          </p>
          <p className="mt-3 text-xs text-zinc-400">
            Some jurisdictions do not allow certain limitations on liability. In those jurisdictions,
            our liability is limited to the greatest extent permitted by law.
          </p>
        </Section>

        <Section title="11. Governing Law & Disputes">
          <p>
            These Terms are governed by and construed in accordance with applicable law. Any dispute
            arising from these Terms or your use of the Service shall first be attempted to be
            resolved informally by contacting us at{' '}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-[#7B72F8] hover:underline">{LEGAL_EMAIL}</a>.
            If informal resolution fails, disputes shall be resolved through binding arbitration,
            except that either party may seek injunctive or equitable relief in a court of competent
            jurisdiction for intellectual property violations.
          </p>
          <p className="mt-3">
            <strong className="text-zinc-200">EU/EEA users</strong> — nothing in these Terms
            restricts your rights under mandatory EU consumer protection law or your right to
            bring claims before your local courts.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p>
            We may modify these Terms at any time. For material changes, we will provide at least
            7 days&apos; notice via in-app notification or email. If you continue to use the Service
            after the new Terms take effect, you accept the updated Terms. If you do not agree,
            you must stop using the Service and delete your account before the effective date.
          </p>
        </Section>

        <Section title="13. Contact">
          <div className="space-y-1">
            <strong className="text-zinc-200 block">{COMPANY}</strong>
            <p>General: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B72F8] hover:underline">{SUPPORT_EMAIL}</a></p>
            <p>Legal: <a href={`mailto:${LEGAL_EMAIL}`} className="text-[#7B72F8] hover:underline">{LEGAL_EMAIL}</a></p>
            <p>Copyright: <a href="mailto:copyright@wewatch.uz" className="text-[#7B72F8] hover:underline">copyright@wewatch.uz</a></p>
            <p className="mt-3">
              Related policies:{' '}
              <Link href="/privacy-policy" className="text-[#7B72F8] hover:underline">Privacy Policy</Link>
              {' '}·{' '}
              <Link href="/dmca" className="text-[#7B72F8] hover:underline">DMCA Policy</Link>
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
      <div className="text-zinc-400 text-sm leading-7 space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-zinc-200 font-medium mt-4 mb-2">{children}</h3>;
}
