'use client';

import { useState, useEffect } from 'react';
import { FaFilm, FaClock, FaTrophy, FaChartBar } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { MdBarChart } from 'react-icons/md';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/types';

interface UserStats {
  moviesWatched:     number;
  minutesWatched:    number;
  watchParties:      number;
  battlesWon:        number;
  battlesTotal:      number;
  achievements:      number;
  totalPoints:       number;
  rank:              string;
  genreDistribution: { genre: string; count: number }[];
}

const RANK_COLOR: Record<string, string> = {
  bronze:  'text-amber-500',
  silver:  'text-zinc-400',
  gold:    'text-amber-400',
  diamond: 'text-[#7B72F8]',
  legend:  'text-[#7B72F8]',
};

function getToken(): string {
  return useAuthStore.getState().accessToken ?? '';
}

export default function StatsPage() {
  const t    = useTranslations('stats');
  const user = useAuthStore((s) => s.user);
  const [stats,   setStats]   = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/user-stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`stats ${res.status}`);
        const json: ApiResponse<UserStats> = await res.json() as ApiResponse<UserStats>;
        setStats(json.data ?? null);
      } catch (err) {
        logger.error('Statistika yuklashda xato', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  /* ── Loading skeleton ─────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-44 bg-white/[0.05] rounded animate-pulse" />
        <div className="h-24 bg-white/[0.05] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.05] rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-white/[0.05] rounded-2xl animate-pulse" />
      </div>
    );
  }

  const hoursWatched = stats ? Math.floor(stats.minutesWatched / 60) : 0;
  const minsWatched  = stats ? stats.minutesWatched % 60 : 0;

  const statCards = [
    {
      icon:  FaFilm,
      label: t('moviesLabel'),
      val:   stats?.moviesWatched ?? 0,
      color: 'text-[#7B72F8]',
      bg:    'bg-[#7B72F8]/10 border-[#7B72F8]/20',
    },
    {
      icon:  FaClock,
      label: t('timeLabel'),
      val:   hoursWatched > 0 ? `${hoursWatched}h ${minsWatched}m` : `${minsWatched}m`,
      color: 'text-cyan-400',
      bg:    'bg-cyan-400/10 border-cyan-400/20',
    },
    {
      icon:  FaTrophy,
      label: t('achievementsLabel'),
      val:   stats?.achievements ?? 0,
      color: 'text-amber-400',
      bg:    'bg-amber-400/10 border-amber-400/20',
    },
    {
      icon:  GiCrossedSwords,
      label: t('battleWins'),
      val:   `${stats?.battlesWon ?? 0}/${stats?.battlesTotal ?? 0}`,
      color: 'text-emerald-400',
      bg:    'bg-emerald-400/10 border-emerald-400/20',
    },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <FaChartBar size={22} className="text-[#7B72F8]" />
        <h1 className="text-3xl font-display text-white">{t('title')}</h1>
      </div>

      {/* Error / empty state */}
      {(error || !stats) && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-5">
            <MdBarChart size={36} className="text-zinc-700" />
          </div>
          <p className="text-zinc-400 text-sm mb-1">
            {error ? 'Statistikani yuklashda xato yuz berdi' : 'Hali statistika mavjud emas'}
          </p>
          <p className="text-zinc-600 text-xs">
            {error ? 'Keyinroq qaytib keling' : "Film ko'ring va statistikangiz shu yerda ko'rinadi"}
          </p>
        </div>
      )}

      {stats && (
        <>
          {/* Rank + points banner */}
          <div className="relative rounded-2xl bg-[#111118] border border-white/[0.06] p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-600 mb-1">{t('currentRank')}</p>
              <p className={`text-3xl font-display capitalize ${RANK_COLOR[user?.rank ?? stats.rank ?? 'bronze'] ?? 'text-zinc-400'}`}>
                {user?.rank ?? stats.rank ?? '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-600 mb-1">{t('totalPoints')}</p>
              <p className="text-3xl font-display text-[#7B72F8]">
                {(user?.totalPoints ?? stats.totalPoints ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="absolute pointer-events-none inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_60%_at_50%_100%,rgba(123,114,248,0.08),transparent)]" />
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {statCards.map(({ icon: Icon, label, val, color, bg }) => (
              <div
                key={label}
                className={`rounded-2xl bg-[#111118] border ${bg} p-4 flex flex-col items-center text-center gap-2`}
              >
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon size={20} className={color} />
                </div>
                <p className={`text-2xl font-display ${color}`}>{val}</p>
                <p className="text-[11px] text-zinc-600 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Genre distribution */}
          {stats.genreDistribution && stats.genreDistribution.length > 0 && (
            <div className="rounded-2xl bg-[#111118] border border-white/[0.06] p-5 space-y-4">
              <h2 className="text-base font-display text-white">{t('genres')}</h2>
              <div className="space-y-3">
                {stats.genreDistribution.slice(0, 8).map(({ genre, count }) => {
                  const max = stats.genreDistribution[0]?.count ?? 1;
                  const pct = Math.round((count / max) * 100);
                  return (
                    <div key={genre}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="text-zinc-300 text-xs font-medium">{genre}</span>
                        <span className="text-zinc-600 text-xs">{count} {t('filmUnit')}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7B72F8] transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Watch party */}
          <div className="rounded-2xl bg-[#111118] border border-white/[0.06] p-5">
            <h2 className="text-base font-display text-white mb-2">{t('watchPartyTitle')}</h2>
            <p className="text-zinc-600 text-sm">
              {t('total')}{' '}
              <span className="text-[#7B72F8] font-semibold">{stats.watchParties ?? 0}</span>{' '}
              {t('watchPartyCount')}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
