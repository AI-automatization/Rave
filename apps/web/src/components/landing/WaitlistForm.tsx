'use client';

import { useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { trackWaitlistSubmit } from '@/lib/analytics/events';

/** Identifies this form in `waitlist_submit`; not a page, so not a path. */
const CONTENT_SLUG = 'mobile_apps_waitlist';

export function WaitlistForm() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.includes('@')) return;

    // The visible acknowledgement stays optimistic — that is a deliberate UX
    // choice from the previous landing page. The event is not: it reports what
    // actually happened, so a broken endpoint shows up as failed submissions
    // instead of as signups.
    let result: 'success' | 'error' = 'success';
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (!response.ok) result = 'error';
    } catch {
      result = 'error';
    }

    trackWaitlistSubmit(pathname, CONTENT_SLUG, result);
    setDone(true);
  };

  if (done) {
    return <p className="flex items-center gap-2 text-sm text-green-400"><span>✓</span><span>{t('waitlistThanks')}</span></p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center gap-2" aria-label="Mobile apps waitlist">
      <input
        type="email"
        value={email}
        onChange={event => setEmail(event.target.value)}
        placeholder={t('waitlistPlaceholder')}
        required
        className="h-11 flex-1 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#7B72F8]/60 focus:outline-none focus:ring-1 focus:ring-[#7B72F8]/30"
        aria-label="Email for mobile app notifications"
      />
      <button type="submit" className="h-11 whitespace-nowrap rounded-xl border border-[#7B72F8]/50 bg-[#7B72F8]/12 px-5 text-sm font-semibold text-white hover:bg-[#7B72F8]/20">
        {t('waitlistBtn')}
      </button>
    </form>
  );
}
