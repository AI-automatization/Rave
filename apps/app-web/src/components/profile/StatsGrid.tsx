'use client';

import { useTranslations } from 'next-intl';
import { Tv, Users, Star, Trophy } from 'lucide-react';
import { useUserStats } from '@/hooks/use-profile';

const STAT_CONFIG = [
  {
    key: 'films',
    icon: Tv,
    color: 'text-violet-400',
    bg: 'bg-violet-500/[0.1]',
    border: 'border-violet-500/[0.15]',
    glow: 'shadow-[0_0_20px_rgba(124,58,237,0.08)]',
  },
  {
    key: 'friends',
    icon: Users,
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/[0.1]',
    border: 'border-cyan-500/[0.15]',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.06)]',
  },
  {
    key: 'points',
    icon: Star,
    color: 'text-amber-400',
    bg: 'bg-amber-500/[0.1]',
    border: 'border-amber-500/[0.15]',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.06)]',
  },
  {
    key: 'rank',
    icon: Trophy,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/[0.1]',
    border: 'border-emerald-500/[0.15]',
    glow: 'shadow-[0_0_20px_rgba(52,211,153,0.06)]',
  },
] as const;

export function StatsGrid() {
  const t = useTranslations('profile');
  const { data: stats } = useUserStats();

  const values = [
    stats?.totalWatched ?? 0,
    stats?.friendsCount ?? 0,
    stats?.totalPoints ?? 0,
    stats?.rank ?? '—',
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STAT_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon;
        return (
          <div
            key={cfg.key}
            className={`liquid-glass-sm p-4 flex flex-col items-center gap-2.5 cursor-default hover:border-white/[0.18] transition-all ${cfg.glow}`}
          >
            <div className={`w-9 h-9 rounded-xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
              <Icon size={16} className={cfg.color} />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-2xl font-bold text-white tabular-nums">{values[i]}</span>
              <span className="text-[11px] text-slate-500">{t(cfg.key as 'films' | 'friends' | 'points' | 'rank')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
