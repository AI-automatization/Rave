'use client';

import { useTranslations } from 'next-intl';
import { Tv, Users, Star, Trophy } from 'lucide-react';
import { useUserStats } from '@/hooks/use-profile';

/* Har rang bitta ma'noga biriktirilgan (globals.css dagi geymifikatsiya
   izohiga qarang): ball — gold, daraja — streak. Ilgari bu yerda to'g'ridan
   Tailwind ranglari (cyan/amber/emerald) va `shadow-[0_0_20px_…]` yorug'lik
   dog'lari bor edi — WW v2 da chuqurlik soya bilan emas, sirt + chegara
   bilan beriladi. */
const STAT_CONFIG = [
  { key: 'films',   icon: Tv,     color: 'var(--ww-accent-hi)', bg: 'var(--ww-accent-soft)' },
  { key: 'friends', icon: Users,  color: 'var(--ww-online)',    bg: 'var(--ww-success-soft)' },
  { key: 'points',  icon: Star,   color: 'var(--ww-gold)',      bg: 'var(--ww-gold-soft)' },
  { key: 'rank',    icon: Trophy, color: 'var(--ww-streak)',    bg: 'var(--ww-streak-soft)' },
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
    // 4-across only in the `sm`–`lg` band, where this is a full-width row under the profile card.
    // From `lg` it becomes a 20rem side rail (see ProfileContent), and four tiles in that width
    // would squeeze each one to ~4rem — back to 2 columns there.
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
      {STAT_CONFIG.map((cfg, i) => {
        const Icon = cfg.icon;
        return (
          <div key={cfg.key} className="ww-card flex flex-col items-center gap-2.5 p-4">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[var(--ww-r-sm)]"
              style={{ background: cfg.bg, color: cfg.color }}
            >
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="flex flex-col items-center gap-0.5">
              <span className="text-[22px] font-semibold tabular-nums leading-none text-[var(--ww-text)]">
                {values[i]}
              </span>
              <span className="text-[11.5px] text-[var(--ww-text-3)]">
                {t(cfg.key as 'films' | 'friends' | 'points' | 'rank')}
              </span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
