'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrophy, FaTimes } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { BattleCard } from '@/components/battle/BattleCard';
import { apiClient } from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { logger } from '@/lib/logger';
import type { ApiResponse, IBattle } from '@/types';

export default function BattlePage() {
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
      setCreateError(msg ?? 'Battle yaratishda xato');
      logger.error('Battle yaratishda xato', err);
    } finally {
      setCreating(false);
    }
  };

  const activeBattles = battles.filter((b) => b.status === 'active');
  const completedBattles = battles.filter((b) => b.status === 'completed');
  const pendingBattles = battles.filter((b) => b.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display">BATTLE</h1>
        <button
          className="btn btn-primary btn-sm gap-2"
          onClick={() => setShowCreate(true)}
        >
          <FaPlus size={18} />
          Yangi battle
        </button>
      </div>

      {/* Create Battle Modal */}
      {showCreate && (
        <div className="modal modal-open">
          <div className="modal-box bg-base-200 max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-xl">BATTLE YARATISH</h3>
              <button className="btn btn-ghost btn-sm btn-circle" onClick={() => setShowCreate(false)}>
                <FaTimes size={18} />
              </button>
            </div>
            {createError && <div className="alert alert-error text-sm mb-3">{createError}</div>}
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Raqib username</span></label>
                <input
                  type="text"
                  value={opponentUsername}
                  onChange={(e) => setOpponentUsername(e.target.value)}
                  placeholder="username"
                  className="input input-bordered bg-base-300"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label"><span className="label-text">Musobaqa davomiyligi</span></label>
                <div className="flex gap-2">
                  {([3, 5, 7] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDuration(d)}
                      className={`btn flex-1 ${duration === d ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      {d} kun
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full" disabled={creating}>
                {creating ? <span className="loading loading-spinner loading-sm" /> : 'Boshlash'}
              </button>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowCreate(false)} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card bg-base-200 animate-pulse h-40" />
          ))}
        </div>
      ) : battles.length === 0 ? (
        <div className="text-center py-20">
          <GiCrossedSwords size={74} className="mx-auto text-base-content/10 mb-4" />
          <p className="text-base-content/40 mb-4">Hali battle yo&apos;q</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Birinchi battleni boshlash
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeBattles.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-base-content/50 mb-3 uppercase tracking-wider">Faol</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeBattles.map((b) => (
                  <BattleCard key={b._id} battle={b} currentUserId={user?.id ?? ''} />
                ))}
              </div>
            </section>
          )}
          {pendingBattles.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-base-content/50 mb-3 uppercase tracking-wider">Kutilmoqda</h2>
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
                Tugatilgan
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
