'use client';

import { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaTrophy, FaTimes } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { useTranslations } from 'next-intl';
import { BattleCard } from '@/components/battle/BattleCard';
import { useAuthStore } from '@/store/auth.store';
import { apiClient } from '@/lib/axios';
import { logger } from '@/lib/logger';
import type { ApiResponse, IBattle } from '@/types';

export default function BattlePage() {
  const t    = useTranslations('battle');
  const user = useAuthStore((s) => s.user);

  const [battles,  setBattles]  = useState<IBattle[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [opponentUsername, setOpponentUsername] = useState('');
  const [duration,  setDuration]  = useState<3 | 5 | 7>(3);
  const [creating,  setCreating]  = useState(false);
  const [formError, setFormError] = useState('');

  const loadBattles = useCallback(async () => {
    try {
      const res = await apiClient.get<ApiResponse<IBattle[]>>('/api/battles/me');
      setBattles(Array.isArray(res.data.data) ? res.data.data : []);
    } catch (err) {
      logger.error('Battlelar yuklashda xato', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadBattles(); }, [loadBattles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponentUsername.trim()) return;
    setCreating(true);
    setFormError('');
    try {
      await apiClient.post('/api/battles', { opponentUsername: opponentUsername.trim(), duration });
      setShowForm(false);
      setOpponentUsername('');
      void loadBattles();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message ?? t('defaultError');
      setFormError(msg);
      logger.error('Battle yaratishda xato', err);
    } finally {
      setCreating(false);
    }
  };

  const handleAccept = async (battleId: string) => {
    try {
      await apiClient.post(`/api/battles/${battleId}/accept`);
      void loadBattles();
    } catch (err) {
      logger.error('Battle qabul qilishda xato', err);
    }
  };

  const activeBattles    = battles.filter((b) => b.status === 'active');
  const pendingBattles   = battles.filter((b) => b.status === 'pending');
  const completedBattles = battles.filter((b) => b.status === 'completed');

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <GiCrossedSwords size={22} className="text-[#7C3AED]" />
          <h1 className="text-3xl font-display text-white">{t('title')}</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 h-9 px-4 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] shadow-[0_0_16px_rgba(124,58,237,0.35)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all"
        >
          <FaPlus size={12} />
          {t('newBattle')}
        </button>
      </div>

      {/* ── Create modal ────────────────────────────────────── */}
      {showForm && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setShowForm(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-[#111118] border border-white/[0.08] p-6 space-y-5">

              {/* Modal header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GiCrossedSwords size={18} className="text-[#7C3AED]" />
                  <h3 className="font-display text-xl text-white">{t('createTitle')}</h3>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-7 h-7 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] flex items-center justify-center transition-all"
                >
                  <FaTimes size={14} />
                </button>
              </div>

              {/* Error */}
              {formError && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3">
                  {formError}
                </div>
              )}

              <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">

                {/* Opponent input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    {t('opponentLabel')}
                  </label>
                  <input
                    type="text"
                    value={opponentUsername}
                    onChange={(e) => setOpponentUsername(e.target.value)}
                    placeholder="username"
                    required
                    className="w-full h-10 px-3.5 rounded-xl bg-[#0A0A0F] border border-white/[0.08] text-zinc-200 text-sm placeholder-zinc-600 focus:outline-none focus:border-[#7C3AED]/50 focus:ring-1 focus:ring-[#7C3AED]/30 transition-all"
                  />
                </div>

                {/* Duration picker */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                    {t('durationLabel')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {([3, 5, 7] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDuration(d)}
                        className={`h-9 rounded-xl text-sm font-semibold transition-all ${
                          duration === d
                            ? 'bg-[#7C3AED] text-white shadow-[0_0_12px_rgba(124,58,237,0.4)]'
                            : 'bg-white/[0.04] border border-white/[0.06] text-zinc-400 hover:border-white/10 hover:text-zinc-300'
                        }`}
                      >
                        {d} {t('days')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-10 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  ) : (
                    t('start')
                  )}
                </button>
              </form>
            </div>
          </div>
        </>
      )}

      {/* ── Content ─────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : battles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#111118] border border-white/[0.06] flex items-center justify-center mb-5">
            <GiCrossedSwords size={32} className="text-zinc-700" />
          </div>
          <p className="text-zinc-400 text-sm mb-1">{t('empty')}</p>
          <p className="text-zinc-600 text-xs mb-5">Raqibingizni tanlang va jang boshlang</p>
          <button
            onClick={() => setShowForm(true)}
            className="h-9 px-5 rounded-xl bg-[#7C3AED] text-white text-sm font-semibold hover:bg-[#6D28D9] transition-all"
          >
            {t('firstBattle')}
          </button>
        </div>
      ) : (
        <div className="space-y-8">

          {activeBattles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {t('statusActive')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeBattles.map((b) => (
                  <BattleCard key={b._id} battle={b} currentUserId={user?.id ?? ''} onAccept={handleAccept} />
                ))}
              </div>
            </section>
          )}

          {pendingBattles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {t('statusPending')}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingBattles.map((b) => (
                  <BattleCard key={b._id} battle={b} currentUserId={user?.id ?? ''} onAccept={handleAccept} />
                ))}
              </div>
            </section>
          )}

          {completedBattles.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FaTrophy size={11} className="text-amber-400" />
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                  {t('statusCompleted')}
                </h2>
              </div>
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
