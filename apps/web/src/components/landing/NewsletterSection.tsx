'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { FaCheck } from 'react-icons/fa';
import { trackWaitlistSubmit } from '@/lib/analytics/events';

interface CampaignData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  subscriberCount: number;
}

export function NewsletterSection() {
  const t = useTranslations('landing');
  const locale = useLocale();
  const pathname = usePathname();
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/campaigns')
      .then(response => response.json())
      .then((data: { campaigns?: CampaignData[] }) => setCampaigns(data.campaigns ?? []))
      .catch(() => {});
  }, []);

  if (campaigns.length === 0) return null;

  const handleSubscribe = async (slug: string, event: FormEvent) => {
    event.preventDefault();
    const email = emails[slug] ?? '';
    if (!email.includes('@')) return;
    setSubmitting(previous => ({ ...previous, [slug]: true }));
    let result: 'success' | 'error' = 'success';
    try {
      const response = await fetch(`/api/campaigns/${slug}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale }),
      });
      if (!response.ok) result = 'error';
    } catch {
      result = 'error';
    } finally {
      // The confirmation is shown either way, as before — only the event
      // distinguishes a stored subscription from a failed one.
      trackWaitlistSubmit(pathname, slug, result);
      setDone(previous => ({ ...previous, [slug]: true }));
      setSubmitting(previous => ({ ...previous, [slug]: false }));
    }
  };

  return (
    <section className="relative bg-[#0A0A0F] px-4 py-20" aria-label={t('newsletterEyebrow')}>
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#7B72F8]">{t('newsletterEyebrow')}</p>
          <h2 className="font-display text-3xl uppercase text-white md:text-4xl">{t('newsletterTitle')}</h2>
        </div>
        <div className="flex flex-col gap-4">
          {campaigns.map(campaign => (
            <div key={campaign._id} className="rounded-2xl border border-zinc-800/60 bg-[#111118] p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 text-base font-semibold text-white">{campaign.name}</h3>
                  {campaign.description && <p className="text-sm leading-relaxed text-zinc-400">{campaign.description}</p>}
                  {campaign.subscriberCount > 0 && (
                    <p className="mt-1 text-xs text-zinc-500">{campaign.subscriberCount} {t('newsletterSubscribers')}</p>
                  )}
                </div>
                {done[campaign.slug] ? (
                  <p className="flex shrink-0 items-center gap-1.5 text-sm text-green-400"><FaCheck size={11} /> {t('newsletterDone')}</p>
                ) : (
                  <form onSubmit={event => handleSubscribe(campaign.slug, event)} className="flex w-full gap-2 sm:w-auto sm:min-w-[300px]">
                    <input
                      type="email"
                      required
                      value={emails[campaign.slug] ?? ''}
                      onChange={event => setEmails(previous => ({ ...previous, [campaign.slug]: event.target.value }))}
                      placeholder={t('newsletterPlaceholder')}
                      className="h-10 flex-1 rounded-xl border border-zinc-700/60 bg-zinc-900/80 px-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-[#7B72F8]/60 focus:outline-none"
                    />
                    <button type="submit" disabled={submitting[campaign.slug]} className="h-10 shrink-0 rounded-xl border border-[#7B72F8]/40 bg-[#7B72F8]/20 px-4 text-sm font-semibold text-white disabled:opacity-50">
                      {submitting[campaign.slug] ? '...' : t('newsletterSubscribe')}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
