'use client';

import { useState, useEffect } from 'react';
import { FaTrophy, FaLock } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IAchievement } from '@/types';

const RARITY_CLASSES: Record<string, string> = {
  common:    'border-base-content/20 bg-base-200',
  rare:      'border-info/40 bg-info/5',
  epic:      'border-secondary/40 bg-secondary/5',
  legendary: 'border-accent/60 bg-accent/5',
};

export default function AchievementsPage() {
  const t = useTranslations('achievements');
  const [achievements, setAchievements] = useState<IAchievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [selected, setSelected] = useState<IAchievement | null>(null);

  useEffect(() => {
    void loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const res = await apiClient.get<ApiResponse<IAchievement[]>>('/users/achievements/me');
      setAchievements(res.data.data ?? []);
    } catch (err) {
      logger.error('Yutuqlar yuklashda xato', err);
    } finally {
      setLoading(false);
    }
  };

  const RARITY_LABELS: Record<string, string> = {
    common:    t('rarityCommon'),
    rare:      t('rarityRare'),
    epic:      t('rarityEpic'),
    legendary: t('rarityLegendary'),
  };

  const unlocked = achievements.filter((a) => !!a.unlockedAt);
  const locked   = achievements.filter((a) => !a.unlockedAt);
  const filtered = filter === 'unlocked' ? unlocked : filter === 'locked' ? locked : achievements;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FaTrophy size={28} className="text-accent" />
          <h1 className="text-3xl font-display">{t('title')}</h1>
        </div>
        <div className="text-sm text-base-content/50">
          {unlocked.length} / {achievements.length}
        </div>
      </div>

      {achievements.length > 0 && (
        <div className="space-y-1">
          <progress className="progress progress-primary w-full" value={unlocked.length} max={achievements.length} />
          <p className="text-xs text-base-content/40 text-right">
            {Math.round((unlocked.length / achievements.length) * 100)}% {t('completed')}
          </p>
        </div>
      )}

      <div className="tabs tabs-boxed bg-base-200 w-fit">
        {(['all', 'unlocked', 'locked'] as const).map((f) => (
          <button key={f} className={`tab ${filter === f ? 'tab-active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? t('filterAll') : f === 'unlocked' ? t('filterUnlocked') : t('filterLocked')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="aspect-square bg-base-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/40">
          <FaTrophy size={55} className="mx-auto mb-3 opacity-20" />
          <p>{t('nothingFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map((ach) => {
            const isUnlocked = !!ach.unlockedAt;
            return (
              <motion.div
                key={ach._id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.08 }}
                transition={{ duration: 0.2 }}
                className={`card border cursor-pointer ${
                  isUnlocked ? RARITY_CLASSES[ach.rarity] ?? 'border-base-300 bg-base-200' : 'border-base-300 bg-base-200 opacity-40 grayscale'
                }`}
                onClick={() => setSelected(ach)}
              >
                <div className="card-body p-3 items-center text-center gap-1">
                  {isUnlocked ? (
                    <span className="text-2xl">{ach.icon}</span>
                  ) : (
                    <FaLock size={28} className="text-base-content/30" />
                  )}
                  <p className="text-xs font-medium line-clamp-2 leading-tight">{ach.title}</p>
                  {isUnlocked && (
                    <span className={`text-xs capitalize ${ach.rarity === 'legendary' ? 'text-accent' : 'text-base-content/40'}`}>
                      {RARITY_LABELS[ach.rarity]}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div className="modal modal-open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-box bg-base-200 max-w-sm text-center"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
            >
              <div className="text-5xl mb-4">
                {selected.unlockedAt ? selected.icon : <FaLock size={55} className="mx-auto text-base-content/30" />}
              </div>
              <h3 className="font-display text-2xl">{selected.title.toUpperCase()}</h3>
              <p className="text-base-content/60 text-sm mt-2">{selected.description}</p>
              <div className="mt-3 flex justify-center gap-3">
                <span className={`badge ${selected.rarity === 'legendary' ? 'badge-accent' : 'badge-ghost'} capitalize`}>
                  {RARITY_LABELS[selected.rarity]}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-slate-700 text-slate-300 font-semibold">{selected.points} pts</span>
              </div>
              {selected.unlockedAt && (
                <p className="text-xs text-slate-500 mt-3">
                  {t('unlockedAt')} {new Date(selected.unlockedAt).toLocaleDateString()}
                </p>
              )}
              <div className="mt-4">
                <button className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95 w-full" onClick={() => setSelected(null)}>{t('close')}</button>
              </div>
            </motion.div>
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelected(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
