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
    <div className="max-w-xl mx-auto flex flex-col gap-5">
      {/* Banner */}
      <div
        className="h-28 rounded-2xl overflow-hidden relative"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.6) 0%, rgba(109,40,217,0.4) 40%, rgba(20,14,38,0.8) 100%)',
        }}
      >
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{ background: 'rgba(124,58,237,0.08)' }}
        />
      </div>
      <div className="-mt-16 px-4">
        <ProfileCard user={user} />
      </div>
      <StatsGrid />
    </div>
  );
}
