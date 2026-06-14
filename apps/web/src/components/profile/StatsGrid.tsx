'use client';

import { useTranslations } from 'next-intl';
import { useUserStats } from '@/hooks/use-profile';

export function StatsGrid() {
  const t = useTranslations('profile');
  const { data: stats } = useUserStats();

  const items = [
    { label: t('films'), value: stats?.totalWatched ?? 0 },
    { label: t('friends'), value: stats?.friendsCount ?? 0 },
    { label: t('points'), value: stats?.totalPoints ?? 0 },
    { label: t('rank'), value: stats?.rank ?? '—' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {items.map((stat) => (
        <div key={stat.label} className="card p-4 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-white">{stat.value}</span>
          <span className="text-xs text-slate-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
