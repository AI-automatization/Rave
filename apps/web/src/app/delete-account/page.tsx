import type { Metadata } from 'next';
import Link from 'next/link';
import { FaPlay } from 'react-icons/fa';

export const metadata: Metadata = {
  title: 'Delete Your Account — WeWatch',
  description:
    'How to delete your WeWatch account and all associated personal data — in-app steps and email request option.',
  robots: { index: true, follow: true },
};

const EFFECTIVE_DATE = 'June 12, 2026';
const APP_NAME = 'WeWatch';
const COMPANY = 'WeWatch (Rave)';
const PRIVACY_EMAIL = 'privacy@wewatch.app';
const SUPPORT_EMAIL = 'support@wewatch.app';

export default function DeleteAccountPage() {
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
            <Link href="/privacy-policy" className="hover:text-zinc-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-2">Delete Your Account</h1>
        <p className="text-zinc-500 text-sm mb-12">Last updated: {EFFECTIVE_DATE}</p>

        <div className="bg-[#111118] border-l-4 border-[#7B72F8] rounded-r-xl px-6 py-5 mb-10 text-zinc-400 text-sm leading-7">
          <strong className="text-zinc-200 block mb-1">Your Right to Deletion</strong>
          You can delete your {APP_NAME} account and all associated personal data at any time.
          Deletion is permanent and cannot be undone. This page explains the two ways to request
          deletion and exactly what happens to your data afterwards.
        </div>

        <Section title="Option 1 — Delete In-App (instant)">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Open the {APP_NAME} app and sign in</li>
            <li>Go to <strong className="text-zinc-200">Settings → Account</strong></li>
            <li>Tap <strong className="text-zinc-200">Delete Account</strong></li>
            <li>Confirm the warning dialog and type the confirmation word when prompted</li>
          </ol>
          <p className="mt-3">
            Your account is deactivated immediately and you are signed out on all devices.
            No password re-entry or support ticket required.
          </p>
        </Section>

        <Section title="Option 2 — Request by Email">
          <p>
            If you can no longer access the app (lost device, forgotten credentials, uninstalled app),
            email us from the address associated with your account:
          </p>
          <p className="mt-3">
            <a href={`mailto:${PRIVACY_EMAIL}?subject=Account%20Deletion%20Request`} className="text-[#7B72F8] hover:underline">
              {PRIVACY_EMAIL}
            </a>
            {' '}— subject line: <em>&quot;Account Deletion Request&quot;</em>, including your username.
          </p>
          <p className="mt-2">
            We verify ownership via the registered email address and process the request within{' '}
            <strong className="text-zinc-200">7 days</strong>.
          </p>
        </Section>

        <Section title="What Gets Deleted">
          <ul>
            <li><strong className="text-zinc-200">Account data</strong> — email address, username, password hash, profile photo</li>
            <li><strong className="text-zinc-200">Activity data</strong> — watch history, watch party membership, friend relationships, points, ranks, and achievements</li>
            <li><strong className="text-zinc-200">Device data</strong> — push notification tokens and device identifiers</li>
            <li><strong className="text-zinc-200">Watch party rooms</strong> — rooms you created are deleted immediately, together with their chat messages; you are removed from the member lists of rooms you joined</li>
            <li><strong className="text-zinc-200">Chat messages in other users&apos; rooms</strong> — deleted when those rooms are deleted, consistent with our Privacy Policy</li>
          </ul>
          <p className="mt-3">
            All personal data is removed within <strong className="text-zinc-200">30 days</strong> of the
            deletion request, consistent with our{' '}
            <Link href="/privacy-policy" className="text-[#7B72F8] hover:underline">Privacy Policy</Link>.
          </p>
        </Section>

        <Section title="What May Be Retained">
          <ul>
            <li><strong className="text-zinc-200">Moderation records</strong> — retained in anonymized form for up to 1 year (abuse prevention)</li>
            <li><strong className="text-zinc-200">Server logs</strong> — IP addresses and request logs age out within 90 days on their normal schedule</li>
            <li><strong className="text-zinc-200">Legal obligations</strong> — records we are required to keep by applicable law, for the legally mandated period only</li>
          </ul>
          <p className="mt-3">Retained records are no longer linked to your identity.</p>
        </Section>

        <Section title="Questions">
          <p>
            For anything related to deletion or your data rights, contact{' '}
            <a href={`mailto:${PRIVACY_EMAIL}`} className="text-[#7B72F8] hover:underline">{PRIVACY_EMAIL}</a>
            {' '}or{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#7B72F8] hover:underline">{SUPPORT_EMAIL}</a>.
          </p>
        </Section>
      </main>

      <footer className="border-t border-zinc-800/60 py-6 mt-8">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-zinc-600 text-xs">© {new Date().getFullYear()} {COMPANY}. All rights reserved.</p>
          <div className="flex gap-4 text-zinc-600 text-xs">
            <Link href="/privacy-policy" className="hover:text-zinc-400 transition-colors">Privacy</Link>
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
