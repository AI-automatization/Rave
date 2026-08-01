'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useProfile } from '@/hooks/use-profile';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { StatsGrid } from '@/components/profile/StatsGrid';

export function ProfileContent() {
  const t = useTranslations('profile');
  const { data: user, isLoading } = useProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-violet-400/60" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-zinc-500 text-sm text-center py-20">{t('notFound')}</p>;
  }

  return (
    // `max-w-xl` on every breakpoint left roughly half of a 1440px screen empty (prod audit
    // 2026-08-01). From `lg` the card and the stats sit side by side instead, so the page fills
    // the width without stretching the form fields to an unreadable line length.
    <div className="max-w-xl lg:max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start gap-5">

      {/* Banner + card as one unit. They used to be siblings — the banner spanned the container
          while the card sat inside a `px-4` wrapper, so the banner visibly overhung the card on
          both sides (prod audit). Now the banner is the card's own header and the two edges line
          up by construction. */}
      <div className="relative">
        <div
          className="h-28 sm:h-32 rounded-t-2xl overflow-hidden relative"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.6) 0%, rgba(109,40,217,0.4) 40%, rgba(20,14,38,0.8) 100%)',
          }}
        >
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(124,58,237,0.08)' }}
          />
          {/* Fades the banner into the card below instead of ending on a hard seam. */}
          <div
            className="absolute inset-x-0 bottom-0 h-12"
            style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(14,8,26,0.55) 100%)' }}
          />
        </div>

        <div className="-mt-12 relative">
          <ProfileCard user={user} />
        </div>
      </div>

      {/* Below the card on mobile, a fixed rail on desktop. */}
      <StatsGrid />
    </div>
  );
}
