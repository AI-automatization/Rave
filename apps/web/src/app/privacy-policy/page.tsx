import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'WeWatch Privacy Policy — how we collect, use, and protect your personal data.',
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'June 11, 2026';
const APP_NAME = 'WeWatch';
const COMPANY = 'WeWatch — TEZ KOD LLC';
const PRIVACY_EMAIL = 'support@wewatch.uz';
const SUPPORT_EMAIL = 'support@wewatch.uz';
const APP_URL = 'https://wewatch.uz';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-zinc-300">
      <header className="sticky top-0 z-50 bg-[#0A0A0F]/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#7B72F8] flex items-center justify-center">
              <FaPlay size={9} className="text-white ml-0.5" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              WE<span className="text-[#7B72F8]">WATCH</span>
            </span>
          </Link>
          <div className="flex gap-4 text-sm text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
            <Link href="/dmca" className="hover:text-zinc-300 transition-colors">DMCA</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-zinc-500 text-sm mb-12">
          Last updated: {EFFECTIVE_DATE} &nbsp;·&nbsp; Effective: {EFFECTIVE_DATE}
        </p>

        <div className="bg-[#111118] border-l-4 border-[#7B72F8] rounded-r-xl px-6 py-5 mb-10 text-zinc-400 text-sm leading-7">
          <strong className="text-zinc-200 block mb-1">About This Policy</strong>
          {COMPANY} (&quot;WeWatch&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates the{' '}
          <strong className="text-zinc-200">{APP_NAME}</strong> mobile application, website ({APP_URL}),
          and related services (collectively, the &quot;Service&quot;). This Privacy Policy describes
          what personal information we collect, how we use it, with whom we share it, and your rights.
          By using the Service, you agree to the practices described here.
        </div>

        <Section title="1. Information We Collect">
          <SubHeading>1.1 Information You Provide Directly</SubHeading>
          <ul>
            <li><strong className="text-zinc-200">Account data</strong> — email address, username, password (stored as a bcrypt hash — we never store plaintext passwords)</li>
            <li><strong className="text-zinc-200">Profile data</strong> — display name, optional profile photo you upload</li>
            <li><strong className="text-zinc-200">Support messages</strong> — content of messages you send to our support team</li>
            <li><strong className="text-zinc-200">User-generated content</strong> — chat messages and emoji reactions sent in watch party rooms</li>
          </ul>

          <SubHeading>1.2 Information Collected Automatically</SubHeading>
          <ul>
            <li><strong className="text-zinc-200">Usage data</strong> — watch history, watch party sessions you create or join, video URLs you share within the Service, room membership records</li>
            <li><strong className="text-zinc-200">Device identifiers</strong> — device type, operating system version, Expo / APNs / FCM push notification token (for notifications you opt into). We do <strong className="text-zinc-200">not</strong> collect or use the Apple Advertising Identifier (IDFA) or any equivalent advertising identifier.</li>
            <li><strong className="text-zinc-200">Log data</strong> — IP address, request timestamps, HTTP status codes, error reports (retained 90 days for security and debugging)</li>
            <li><strong className="text-zinc-200">Interaction data</strong> — points, ranks, achievements, friend relationships, and gamification events</li>
            <li><strong className="text-zinc-200">In-app browser domain data</strong> — when you use the in-app browser to visit websites, we log the domain name (e.g., <em>youtube.com</em>) of sites visited, but not the full URL path or page content. This is used solely for abuse detection and blocked-domain enforcement. Third-party websites you visit through the in-app browser are governed by their own privacy policies, which WeWatch does not control.</li>
          </ul>

          <SubHeading>1.3a Device Permissions We Request</SubHeading>
          <p className="mb-2">The app requests the following device permissions. All are optional for core functionality unless noted:</p>
          <ul>
            <li><strong className="text-zinc-200">Photos / Media Library</strong> — requested only when you choose to upload a profile photo. We access only the image you select; we do not scan or access your full photo library.</li>
            <li><strong className="text-zinc-200">Microphone</strong> — requested only when you join a voice chat channel inside a watch party room. Audio is transmitted peer-to-peer via WebRTC and is not recorded or stored by WeWatch.</li>
            <li><strong className="text-zinc-200">Push Notifications</strong> — requested at account setup for watch party invites, friend requests, and other in-app events. You can withdraw this permission at any time via <em>iOS Settings → Notifications → WeWatch</em> or inside the app under <em>Settings → Notifications</em>.</li>
          </ul>

          <SubHeading>1.4 Information from Third-Party Sign-In</SubHeading>
          <p className="mb-2">When you sign in with Google or Apple, we receive:</p>
          <ul>
            <li>Your unique identifier from that provider (Google ID / Apple sub)</li>
            <li>Email address (if you have not hidden it)</li>
            <li>Display name and profile photo (if provided by the platform)</li>
          </ul>
          <p className="mt-2">
            We do not receive your passwords from these providers. We do{' '}
            <strong className="text-zinc-200">not</strong> store your Google or Apple OAuth access
            tokens or refresh tokens on our servers — only the provider&apos;s stable user identifier
            is stored to link your WeWatch account. Apple Sign In is available and supported —
            you may use a private relay email address.
          </p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul>
            <li>Create and authenticate your account; maintain session security</li>
            <li>Provide synchronized watch party experiences — streaming video playback state to all room participants</li>
            <li>Deliver push notifications you have opted into (new friend requests, watch party invites, etc.)</li>
            <li>Calculate and display points, ranks, streaks, and achievements</li>
            <li>Enable social features — friend lists, user search, public profiles</li>
            <li>Moderate content and enforce our Terms of Service (detect spam, abuse, illegal material)</li>
            <li>Respond to support requests and handle appeals</li>
            <li>Comply with legal obligations and respond to lawful requests from authorities</li>
            <li>Improve and develop the Service (aggregated, non-identifiable analytics only)</li>
          </ul>
          <p className="mt-3">
            We <strong className="text-zinc-200">do not</strong> use your data for behavioral advertising,
            cross-context tracking, or sell it to third parties.
          </p>
        </Section>

        <Section title="3. Video Content, In-App Browser & Stream Processing">
          <p className="mb-3">
            {APP_NAME} is a <strong className="text-zinc-200">social watch party platform</strong>{' '}
            built around an integrated web browser (WebView). The core user flow is:
            a user opens a website inside the in-app browser, the website loads a video on the
            user&apos;s own device (exactly as it would in Safari or Chrome), {APP_NAME} detects the
            video stream URL that the website has already loaded, and then facilitates synchronized
            playback of that URL for all participants in the same watch party room.
          </p>

          <SubHeading>3.1 No Server-Side Proxying or Storing of Video</SubHeading>
          <ul>
            <li>
              <strong className="text-zinc-200">WeWatch is not a video proxy or CDN.</strong>{' '}
              Video data travels directly from the source website&apos;s servers to the user&apos;s device.
              WeWatch servers never receive, buffer, cache, store, or retransmit video content.
            </li>
            <li>
              <strong className="text-zinc-200">Client-side URL detection.</strong> The app detects
              media stream URLs (e.g., HLS/MPEG-DASH manifests) that the in-app browser has already
              loaded from the source website. This detection runs locally on the user&apos;s device — no
              video request is made by our servers. It is technically equivalent to copying the
              address bar URL of a video that is playing in a browser.
            </li>
            <li>
              <strong className="text-zinc-200">No DRM circumvention.</strong> {APP_NAME} does not
              bypass, decrypt, or circumvent any digital rights management (DRM) system, encryption,
              or technical protection measure (as defined under 17 U.S.C. § 1201). Content protected
              by DRM (Widevine, FairPlay, PlayReady) cannot be extracted or played by this method —
              only publicly playable streams accessible without DRM are detectable.
            </li>
            <li>
              <strong className="text-zinc-200">No content downloading.</strong> The app does not
              provide any functionality to download, save, or permanently store video files on the
              user&apos;s device or our servers from third-party sources.
            </li>
          </ul>

          <SubHeading>3.2 In-App Browser & Third-Party Websites</SubHeading>
          <ul>
            <li>
              The in-app browser is a standard WebView component. When you navigate to a
              third-party website, that website loads in its entirety on your device. WeWatch has
              no special access to the content of those websites beyond what a standard browser provides.
            </li>
            <li>
              <strong className="text-zinc-200">Third-party privacy policies apply.</strong> When you
              use the in-app browser to visit any third-party website, that website&apos;s own privacy
              policy and terms of service govern how it collects and processes your data. WeWatch
              is not responsible for the data practices of third-party websites.
            </li>
            <li>
              <strong className="text-zinc-200">WebView storage.</strong> Cookies and local storage
              set by third-party websites within the in-app browser are stored in an isolated
              WebView container on your device and are not shared with WeWatch or transmitted to
              our servers.
            </li>
          </ul>

          <SubHeading>3.3 User Responsibility</SubHeading>
          <ul>
            <li>
              Users are solely responsible for ensuring they have lawful access to any content
              they share or watch via the Service, including compliance with the terms of service
              of any third-party website they visit through the in-app browser.
            </li>
            <li>
              Sharing URLs to copyrighted content without authorization violates our Terms of
              Service and applicable copyright law.
            </li>
          </ul>

          <p className="mt-3">
            URLs shared within a watch party room are stored on our servers solely to maintain
            room state and enable session continuity for participants. We log the domain (not
            the full URL path) of sites visited for abuse detection and blocked-domain enforcement.
            Full URLs shared in rooms are retained for the lifetime of the room (auto-purged 30
            days after the room ends).
          </p>
        </Section>

        <Section title="4. Data Sharing & Disclosure">
          <p className="mb-3">
            We share personal data only in the following circumstances:
          </p>
          <ul>
            <li>
              <strong className="text-zinc-200">Service Providers</strong> — third parties who help us
              operate the Service. Each provider is contractually bound to protect your data to at
              least the same standard described in this Privacy Policy and is prohibited from using
              your data for any purpose other than providing services to us:
              <ul className="mt-1 ml-4">
                <li><em>Railway.app</em> — all application servers and databases (MongoDB, Redis, Elasticsearch are self-hosted on Railway infrastructure — not a third-party database provider). <a href="https://railway.app/legal/privacy" className="text-[#7B72F8] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                <li><em>Google Firebase (FCM)</em> — push notification delivery. Only your FCM device token is shared, not message content. <a href="https://firebase.google.com/support/privacy" className="text-[#7B72F8] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                <li><em>Sentry.io</em> — error monitoring. Error reports contain no personal data by design (user identifiers and personal fields are scrubbed before transmission). <a href="https://sentry.io/privacy/" className="text-[#7B72F8] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                <li><em>Google Sign-In</em> — authentication only if you choose this method. <a href="https://policies.google.com/privacy" className="text-[#7B72F8] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
                <li><em>Apple Sign In</em> — authentication only if you choose this method. <a href="https://www.apple.com/legal/privacy" className="text-[#7B72F8] hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              </ul>
            </li>
            <li>
              <strong className="text-zinc-200">Legal Requirements</strong> — we disclose data when
              required by applicable law, court order, or governmental authority, or when necessary to
              protect our rights, users, or the public from harm.
            </li>
            <li>
              <strong className="text-zinc-200">Business Transfers</strong> — in the event of a merger,
              acquisition, or sale of assets, your data may be transferred. We will notify you via
              in-app notice or email before your data becomes subject to a different privacy policy.
            </li>
            <li>
              <strong className="text-zinc-200">With Your Consent</strong> — for any other purpose,
              only with your explicit consent.
            </li>
          </ul>
          <p className="mt-3">
            We do <strong className="text-zinc-200">not</strong> sell personal data. We do{' '}
            <strong className="text-zinc-200">not</strong> share data with advertising networks.
            We do <strong className="text-zinc-200">not</strong> share data with third-party
            AI services. We do <strong className="text-zinc-200">not</strong> use data collected
            in WeWatch to target advertising in any other app or context.
          </p>
        </Section>

        <Section title="5. Data Retention">
          <ul>
            <li><strong className="text-zinc-200">Active accounts</strong> — retained for the lifetime of the account</li>
            <li><strong className="text-zinc-200">Deleted accounts</strong> — all personal data removed within 30 days of deletion request; moderation records may be retained in anonymized form up to 1 year</li>
            <li><strong className="text-zinc-200">Access logs</strong> — retained 90 days for security</li>
            <li><strong className="text-zinc-200">Watch party room data</strong> — automatically purged 30 days after a room ends</li>
            <li><strong className="text-zinc-200">Chat messages</strong> — deleted when the watch party room is deleted</li>
            <li><strong className="text-zinc-200">Support tickets</strong> — retained for up to 2 years to maintain support history</li>
          </ul>
        </Section>

        <Section title="6. Your Privacy Rights">
          <p className="mb-3">
            Depending on your jurisdiction, you may have the following rights:
          </p>
          <ul>
            <li><strong className="text-zinc-200">Access</strong> — request a copy of the personal data we hold about you</li>
            <li><strong className="text-zinc-200">Correction</strong> — request correction of inaccurate or incomplete data</li>
            <li><strong className="text-zinc-200">Deletion</strong> — request deletion of your account and all associated personal data (available in-app under Settings → Account → Delete Account)</li>
            <li><strong className="text-zinc-200">Portability</strong> — receive your data in a machine-readable format</li>
            <li><strong className="text-zinc-200">Restriction</strong> — request we restrict processing of your data</li>
            <li><strong className="text-zinc-200">Objection</strong> — object to processing based on legitimate interests</li>
            <li><strong className="text-zinc-200">Withdraw Consent</strong> — withdraw consent for optional processing (e.g., push notifications) at any time</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, contact us at{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#7B72F8] hover:underline">{PRIVACY_EMAIL}</a>.
            We will respond within 30 days (as required by GDPR) or 45 days (as required by CCPA).
          </p>
          <p className="mt-3">
            <strong className="text-zinc-200">GDPR (EEA/UK users)</strong> — our legal bases for processing are:
            performance of contract (providing the Service), legitimate interests (security, abuse prevention),
            legal obligation, and consent (optional features). You may lodge a complaint with your local
            supervisory authority.
          </p>
          <p className="mt-3">
            <strong className="text-zinc-200">CCPA (California residents)</strong> — we do not sell or
            share personal information for cross-context behavioral advertising. You have the right to
            know, delete, and opt out. To submit a verifiable consumer request, email{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#7B72F8] hover:underline">{PRIVACY_EMAIL}</a>.
          </p>
        </Section>

        <Section title="7. Age Requirements & Children's Privacy (COPPA)">
          <p>
            {APP_NAME} is intended for users aged <strong className="text-zinc-200">17 and older</strong>.
            The app carries a <strong className="text-zinc-200">17+</strong> age rating on the App Store
            due to user-generated content and the potential for mature video content shared by users in
            watch party rooms.
          </p>
          <p className="mt-2">
            We do not knowingly collect personal information from anyone under the age of 13
            (or 16 in the EEA/UK, per GDPR). If we discover that a person under 13 has provided
            us with personal data without verifiable parental consent, we will delete that data
            immediately in compliance with the Children&apos;s Online Privacy Protection Act (COPPA)
            and applicable law.
          </p>
          <p className="mt-2">
            If you believe a minor has registered on the Service, please contact us immediately at{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#7B72F8] hover:underline">{PRIVACY_EMAIL}</a>{' '}
            and we will investigate and remove the account promptly.
          </p>
        </Section>

        <Section title="8. Security">
          <ul>
            <li>Passwords stored as bcrypt hashes (12 rounds) — never plaintext</li>
            <li>All API communication over TLS 1.2+</li>
            <li>RS256-signed JWT access tokens with 15-minute expiry</li>
            <li>Redis-backed rate limiting and brute-force protection (5 attempts → 15-minute lockout)</li>
            <li>Database encryption at rest (self-hosted MongoDB on Railway)</li>
            <li>Internal service-to-service calls authenticated with a shared secret over private network</li>
          </ul>
          <p className="mt-3">
            No system is 100% secure. If you discover a vulnerability, please disclose responsibly
            to <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B72F8] hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="9. Cookies, Tracking & Advertising Identifiers">
          <ul>
            <li>
              <strong className="text-zinc-200">No cross-app tracking.</strong> WeWatch does not track
              your activity across other companies&apos; apps or websites. We do not participate in
              cross-context behavioral advertising.
            </li>
            <li>
              <strong className="text-zinc-200">No IDFA.</strong> We do not collect, access, or use
              the Apple Advertising Identifier (IDFA) or any equivalent advertising or device
              identifier for tracking purposes. We have not integrated any ad networks or tracking SDKs.
            </li>
            <li>
              <strong className="text-zinc-200">App Tracking Transparency.</strong> Because WeWatch
              does not track users, we do not display an App Tracking Transparency (ATT) prompt. No
              tracking permission is requested or required.
            </li>
            <li>
              <strong className="text-zinc-200">Cookies.</strong> The WeWatch mobile app does not use
              browser cookies. Our website may use technically necessary session cookies only. No
              advertising, analytics, or third-party tracking cookies are used.
            </li>
            <li>
              <strong className="text-zinc-200">Push notification consent.</strong> You can withdraw
              consent for push notifications at any time via <em>iOS Settings → Notifications → WeWatch</em>{' '}
              or within the app under <em>Settings → Notifications</em>. Withdrawing this consent does
              not affect your ability to use any other feature of the Service.
            </li>
          </ul>
        </Section>

        <Section title="10. International Data Transfers">
          <p>
            Our servers are hosted in the United States via Railway.app. Database data is stored in
            MongoDB Atlas (US region). If you are located in the EEA, UK, or other jurisdictions with
            data transfer restrictions, by using the Service you acknowledge that your data is transferred
            to the US under standard contractual clauses or equivalent safeguards as applicable.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material
            changes via in-app notification or email at least 7 days before the change takes effect.
            The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
            Continued use of the Service after the effective date constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="12. Contact">
          <div className="space-y-1">
            <strong className="text-zinc-200 block">{COMPANY}</strong>
            <p className="text-zinc-500 text-xs">Registered in Tashkent, Republic of Uzbekistan</p>
            <p>
              Privacy &amp; support:{' '}
              <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#7B72F8] hover:underline">{PRIVACY_EMAIL}</a>
            </p>
            <p>
              DMCA / Copyright:{' '}
              <a href="mailto:support@wewatch.uz" className="text-[#7B72F8] hover:underline">support@wewatch.uz</a>
            </p>
            <p className="mt-3">
              Additional policies:{' '}
              <Link href="/terms" className="text-[#7B72F8] hover:underline">Terms of Service</Link>
              {' '}·{' '}
              <Link href="/dmca" className="text-[#7B72F8] hover:underline">DMCA Policy</Link>
            </p>
          </div>
        </Section>
      </main>

      <footer className="border-t border-zinc-800/60 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
          <div className="flex gap-4 text-zinc-600 text-xs">
            <Link href="/terms" className="hover:text-zinc-400 transition-colors">Terms</Link>
            <Link href="/dmca" className="hover:text-zinc-400 transition-colors">DMCA</Link>
            <Link href="/" className="hover:text-zinc-400 transition-colors">← Home</Link>
          </div>
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

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-zinc-200 font-medium mt-4 mb-2">{children}</h3>;
}
