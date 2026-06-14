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
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    );
  }

  if (!user) {
    return <p className="text-slate-400 text-center py-20">{t('notFound')}</p>;
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
      <ProfileCard user={user} />
      <StatsGrid />
    </div>
  );
}
