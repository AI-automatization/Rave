'use client';

import { useState, useEffect } from 'react';
import { FaFilm, FaClock, FaTrophy, FaChartBar } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';
import type { ApiResponse } from '@/types';

interface UserStats {
  moviesWatched: number;
  minutesWatched: number;
  watchParties: number;
  battlesWon: number;
  battlesTotal: number;
  achievements: number;
  totalPoints: number;
  rank: string;
  genreDistribution: { genre: string; count: number }[];
}

export default function StatsPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get<ApiResponse<UserStats>>('/users/me/stats');
        setStats(res.data.data);
      } catch (err) {
        logger.error('Statistika yuklashda xato', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const RANK_COLORS: Record<string, string> = {
    bronze:  'text-orange-400',
    silver:  'text-base-content/70',
    gold:    'text-gold',
    diamond: 'text-diamond',
    legend:  'text-primary',
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-base-200 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card bg-base-200 animate-pulse h-28" />
          ))}
        </div>
      </div>
    );
  }

  const hoursWatched = stats ? Math.floor(stats.minutesWatched / 60) : 0;
  const minsWatched = stats ? stats.minutesWatched % 60 : 0;

  const statCards = [
    { icon: FaFilm,          label: 'Filmlar',         val: stats?.moviesWatched ?? 0,    color: 'text-primary' },
    { icon: FaClock,         label: 'Vaqt',            val: `${hoursWatched}s ${minsWatched}d`, color: 'text-secondary' },
    { icon: FaTrophy,        label: 'Yutuqlar',        val: stats?.achievements ?? 0,     color: 'text-accent' },
    { icon: GiCrossedSwords, label: "Battle g'alaba",  val: `${stats?.battlesWon ?? 0}/${stats?.battlesTotal ?? 0}`, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FaChartBar size={28} className="text-primary" />
        <h1 className="text-3xl font-display">STATISTIKA</h1>
      </div>

      {/* Rank + Points */}
      <div className="card bg-base-200">
        <div className="card-body p-5 flex flex-row items-center justify-between">
          <div>
            <p className="text-sm text-base-content/50">Hozirgi rank</p>
            <p className={`text-3xl font-display capitalize ${RANK_COLORS[user?.rank ?? 'bronze']}`}>
              {user?.rank ?? '—'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-base-content/50">Umumiy points</p>
            <p className="text-3xl font-display text-primary">{(user?.totalPoints ?? 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, val, color }) => (
          <div key={label} className="card bg-base-200">
            <div className="card-body p-4 items-center text-center gap-2">
              <Icon size={28} className={color} />
              <p className="text-2xl font-display">{val}</p>
              <p className="text-xs text-base-content/50">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Genre distribution */}
      {stats?.genreDistribution && stats.genreDistribution.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-display">JANRLAR</h2>
          <div className="card bg-base-200">
            <div className="card-body p-5 space-y-3">
              {stats.genreDistribution.slice(0, 8).map(({ genre, count }) => {
                const max = stats.genreDistribution[0]?.count ?? 1;
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={genre} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{genre}</span>
                      <span className="text-base-content/50">{count} film</span>
                    </div>
                    <progress className="progress progress-primary w-full h-2" value={pct} max={100} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Placeholder for watch party stats */}
      <div className="card bg-base-200">
        <div className="card-body p-5">
          <h2 className="font-display text-lg mb-3">WATCH PARTY</h2>
          <p className="text-base-content/50 text-sm">
            Jami: <span className="text-base-content font-medium">{stats?.watchParties ?? 0}</span> ta Watch Party
          </p>
        </div>
      </div>
    </div>
  );
}
