'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrophy, FaTimes } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { useTranslations } from 'next-intl';
import { BattleCard } from '@/components/battle/BattleCard';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';
import type { ApiResponse, IBattle } from '@/types';

export default function BattlePage() {
  const t = useTranslations('battle');
  const user = useAuthStore((s) => s.user);
  const [battles, setBattles] = useState<IBattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [opponentUsername, setOpponentUsername] = useState('');
  const [duration, setDuration] = useState<3 | 5 | 7>(3);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    void loadBattles();
  }, []);

  const loadBattles = async () => {
    try {
      const res = await apiClient.get<ApiResponse<IBattle[]>>('/battles/me');
      setBattles(res.data.data ?? []);
    } catch (err) {
      logger.error('Battlelar yuklashda xato', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentUsername.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      await apiClient.post('/battles', { opponentUsername: opponentUsername.trim(), duration });
      setShowCreate(false);
      setOpponentUsername('');
      void loadBattles();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg ?? t('defaultError'));
      logger.error('Battle yaratishda xato', err);
    } finally {
      setCreating(false);
    }
  };

  const activeBattles    = battles.filter((b) => b.status === 'active');
  const completedBattles = battles.filter((b) => b.status === 'completed');
  const pendingBattles   = battles.filter((b) => b.status === 'pending');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display text-white">{t('title')}</h1>
        <button className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all text-sm font-medium active:scale-95" onClick={() => setShowCreate(true)}>
          <FaPlus size={16} />
          {t('newBattle')}
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-sm p-6 w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl text-white">{t('createTitle')}</h3>
              <button className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-slate-400 hover:bg-slate-700/50 transition-all" onClick={() => setShowCreate(false)}>
                <FaTimes size={16} />
              </button>
            </div>
            {createError && <div className="bg-red-500/20 border border-red-500 text-red-400 text-sm rounded-lg p-3 mb-3">{createError}</div>}
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-1">{t('opponentLabel')}</label>
                <input
                  type="text"
                  value={opponentUsername}
                  onChange={(e) => setOpponentUsername(e.target.value)}
                  placeholder="username"
                  className="w-full h-9 px-3 rounded-lg bg-slate-700 border border-slate-600 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">{t('durationLabel')}</label>
                <div className="flex gap-2">
                  {([3, 5, 7] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`flex-1 h-8 rounded-lg transition-all font-medium text-sm ${duration === d ? 'bg-cyan-500 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {d} {t('days')}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95 w-full" disabled={creating}>
                {creating ? <span className="animate-spin">⟳</span> : t('start')}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-lg h-40 animate-pulse" />
          ))}
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-20">
          <GiCrossedSwords size={64} className="mx-auto text-slate-700 mb-4" />
          <p className="text-slate-500 mb-4">{t('empty')}</p>
          <button className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-cyan-500 text-slate-900 hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all font-medium active:scale-95" onClick={() => setShowCreate(true)}>
            {t('firstBattle')}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeBattles.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-slate-500 mb-3 uppercase tracking-wider">{t('statusActive')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeBattles.map((b) => (
                  <BattleCard key={b._id} battle={b} currentUserId={user?.id ?? ''} />
                ))}
              </div>
            </section>
          )}
          {pendingBattles.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-base-content/50 mb-3 uppercase tracking-wider">{t('statusPending')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBattles.map((b) => (
                  <BattleCard key={b._id} battle={b} currentUserId={user?.id ?? ''} />
                ))}
              </div>
            </section>
          )}
          {completedBattles.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-base-content/50 mb-3 uppercase tracking-wider flex items-center gap-2">
                <FaTrophy size={18} className="text-accent" />
                {t('statusCompleted')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedBattles.map((b) => (
                  <BattleCard key={b._id} battle={b} currentUserId={user?.id ?? ''} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
