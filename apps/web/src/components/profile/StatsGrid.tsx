'use client';

import { useTranslations } from 'next-intl';
import type { IUser } from '@/types';

interface Props {
  user: IUser;
}

export function StatsGrid({ user }: Props) {
  const t = useTranslations('profile');

  const u = user as IUser & Record<string, unknown>;
  const stats = [
    { label: t('films'), value: (u.watchCount as number) ?? 0 },
    { label: t('achievements'), value: (u.achievementCount as number) ?? 0 },
    { label: t('friends'), value: (u.friendCount as number) ?? 0 },
    { label: t('points'), value: (u.points as number) ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card p-4 flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-white">{stat.value}</span>
          <span className="text-xs text-slate-400">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
