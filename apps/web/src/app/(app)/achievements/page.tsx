'use client';

import { useState, useEffect } from 'react';
import { FaTrophy, FaLock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { logger } from '@/lib/logger';
import type { ApiResponse, IAchievement } from '@/types';

const RARITY_BORDER: Record<string, string> = {
  common:    'border-white/[0.08]',
  rare:      'border-blue-500/30',
  epic:      'border-[#7C3AED]/40',
  legendary: 'border-amber-400/50',
};

const RARITY_GLOW: Record<string, string> = {
  common:    '',
  rare:      'shadow-[0_0_12px_rgba(59,130,246,0.12)]',
  epic:      'shadow-[0_0_12px_rgba(124,58,237,0.15)]',
  legendary: 'shadow-[0_0_16px_rgba(251,191,36,0.2)]',
};

const RARITY_TEXT: Record<string, string> = {
  common:    'text-zinc-500',
  rare:      'text-blue-400',
  epic:      'text-[#7C3AED]',
  legendary: 'text-amber-400',
};

function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('access_token') ?? '';
}

export default function AchievementsPage() {
  const t = useTranslations('achievements');
  const [achievements, setAchievements] = useState<IAchievement[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selected, setSelected] = useState<IAchievement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken();
        const res = await fetch('/api/achievements/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json: ApiResponse<IAchievement[]> = await res.json() as ApiResponse<IAchievement[]>;
        setAchievements(json.data ?? []);
      } catch (err) {
        logger.error('Yutuqlar yuklanmadi', err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const RARITY_LABELS: Record<string, string> = {
    common:    t('rarityCommon'),
    rare:      t('rarityRare'),
    epic:      t('rarityEpic'),
    legendary: t('rarityLegendary'),
  };

  const unlocked = achievements.filter((a) => !!a.unlockedAt);
  const locked   = achievements.filter((a) => !a.unlockedAt);
  const filtered = activeFilter === 'unlocked' ? unlocked : activeFilter === 'locked' ? locked : achievements;

  const filterTabs: { key: typeof activeFilter; label: string }[] = [
    { key: 'all',      label: t('filterAll') },
    { key: 'unlocked', label: t('filterUnlocked') },
    { key: 'locked',   label: t('filterLocked') },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaTrophy size={22} className="text-amber-400" />
          <h1 className="text-3xl font-display text-white">{t('title')}</h1>
        </div>
        {!loading && achievements.length > 0 && (
          <span className="text-sm text-zinc-500">
            <span className="text-amber-400 font-semibold">{unlocked.length}</span>
            <span className="text-zinc-700"> / {achievements.length}</span>
          </span>
        )}
      </div>

      {/* Progress bar */}
      {!loading && achievements.length > 0 && (
        <div className="space-y-1.5">
          <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-700"
              style={{ width: `${Math.round((unlocked.length / achievements.length) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-zinc-600 text-right">
            {Math.round((unlocked.length / achievements.length) * 100)}% {t('completed')}
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[#111118] border border-white/[0.06] w-fit">
        {filterTabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveFilter(key)}
            className={`h-8 px-4 rounded-lg text-sm font-medium transition-all ${
              activeFilter === key
                ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-4">
            <FaTrophy size={26} className="text-zinc-700" />
          </div>
          <p className="text-zinc-500 text-sm">{t('nothingFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map((ach) => {
            const isUnlocked = !!ach.unlockedAt;
            return (
              <motion.button
                key={ach._id}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.06 }}
                transition={{ duration: 0.18 }}
                onClick={() => setSelected(ach)}
                className={`rounded-2xl bg-[#111118] border p-3 flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all ${
                  isUnlocked
                    ? `${RARITY_BORDER[ach.rarity] ?? 'border-white/[0.08]'} ${RARITY_GLOW[ach.rarity] ?? ''}`
                    : 'border-white/[0.04] opacity-35 grayscale'
                }`}
              >
                {isUnlocked ? (
                  <span className="text-2xl leading-none">{ach.icon}</span>
                ) : (
                  <FaLock size={22} className="text-zinc-600" />
                )}
                <p className="text-[10px] font-medium text-zinc-400 line-clamp-2 leading-tight">{ach.title}</p>
                {isUnlocked && (
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${RARITY_TEXT[ach.rarity] ?? 'text-zinc-600'}`}>
                    {RARITY_LABELS[ach.rarity] ?? ach.rarity}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full max-w-sm rounded-2xl bg-[#111118] border border-white/[0.08] p-6 text-center space-y-4">
                <div className="text-5xl leading-none">
                  {selected.unlockedAt ? selected.icon : <FaLock size={44} className="mx-auto text-zinc-600" />}
                </div>
                <div>
                  <h3 className="font-display text-2xl text-white uppercase">{selected.title}</h3>
                  <p className="text-zinc-500 text-sm mt-1.5 leading-relaxed">{selected.description}</p>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg ${
                    RARITY_TEXT[selected.rarity] ?? 'text-zinc-500'
                  } bg-white/[0.04] border border-white/[0.06]`}>
                    {RARITY_LABELS[selected.rarity] ?? selected.rarity}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[#7C3AED]">
                    {selected.points} pts
                  </span>
                </div>
                {selected.unlockedAt && (
                  <p className="text-xs text-zinc-600">
                    {t('unlockedAt')} {new Date(selected.unlockedAt).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="w-full h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-all"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
