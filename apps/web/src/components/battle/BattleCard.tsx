'use client';

import Link from 'next/link';
import { FaTrophy, FaClock, FaFilm } from 'react-icons/fa';
import type { IBattle } from '@/types';

interface BattleCardProps {
  battle: IBattle;
  currentUserId: string;
}

const STATUS_LABEL: Record<IBattle['status'], string> = {
  pending: 'Kutilmoqda',
  active: 'Faol',
  completed: 'Tugagan',
};

const STATUS_CLASS: Record<IBattle['status'], string> = {
  pending: 'badge-warning',
  active: 'badge-success',
  completed: 'badge-ghost',
};

export function BattleCard({ battle, currentUserId }: BattleCardProps) {
  const me = battle.participants.find((p) => p.user._id === currentUserId);
  const opponent = battle.participants.find((p) => p.user._id !== currentUserId);
  const isWinner = battle.status === 'completed' && battle.winnerId === currentUserId;

  const daysLeft = battle.status === 'active'
    ? Math.max(0, Math.ceil((new Date(battle.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <Link href={`/battle/${battle._id}`} className="block">
      <div className={`card bg-base-200 hover:bg-base-300 transition-colors ${isWinner ? 'ring ring-accent' : ''}`}>
        <div className="card-body p-4 gap-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isWinner && <FaTrophy size={18} className="text-accent" />}
              <span className={`badge ${STATUS_CLASS[battle.status]} badge-sm`}>
                {STATUS_LABEL[battle.status]}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-base-content/50">
              <FaClock size={14} />
              <span>{battle.duration} kun</span>
            </div>
          </div>

          {/* Participants */}
          <div className="flex items-center justify-between gap-3">
            {/* Me */}
            <div className="flex flex-col items-center gap-1">
              <div className="avatar">
                <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {me?.user.username[0].toUpperCase() ?? '?'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium">{me?.user.username ?? 'Sen'}</span>
              <span className="text-lg font-display text-primary">{me?.score ?? 0}</span>
            </div>

            <span className="text-base-content/30 font-display text-lg">VS</span>

            {/* Opponent */}
            <div className="flex flex-col items-center gap-1">
              <div className="avatar">
                <div className="w-10 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {opponent?.user.username[0].toUpperCase() ?? '?'}
                  </span>
                </div>
              </div>
              <span className="text-xs font-medium">{opponent?.user.username ?? 'Raqib'}</span>
              <span className="text-lg font-display text-secondary">{opponent?.score ?? 0}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-base-content/50">
            <div className="flex items-center gap-1">
              <FaFilm size={14} />
              <span>{me?.moviesWatched ?? 0} film</span>
            </div>
            {battle.status === 'active' && (
              <span className="text-warning">{daysLeft} kun qoldi</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
