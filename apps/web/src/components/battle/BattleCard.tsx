'use client';

import Link from 'next/link';
import { FaTrophy, FaClock, FaFilm } from 'react-icons/fa';
import { GiCrossedSwords } from 'react-icons/gi';
import { useTranslations } from 'next-intl';
import type { IBattle } from '@/types';

interface BattleCardProps {
  battle: IBattle;
  currentUserId: string;
  onAccept?: (battleId: string) => void;
}

const STATUS_STYLE: Record<IBattle['status'], { label: string; dot: string; text: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   text: 'text-amber-400' },
  active:    { label: 'Active',    dot: 'bg-emerald-400', text: 'text-emerald-400' },
  completed: { label: 'Completed', dot: 'bg-zinc-500',    text: 'text-zinc-500' },
  cancelled: { label: 'Cancelled', dot: 'bg-red-400',     text: 'text-red-400' },
  rejected:  { label: 'Rejected',  dot: 'bg-red-400',     text: 'text-red-400' },
};

export function BattleCard({ battle, currentUserId, onAccept }: BattleCardProps) {
  const t = useTranslations('battle');

  const me       = battle.participants.find((p) => p.user._id === currentUserId);
  const opponent = battle.participants.find((p) => p.user._id !== currentUserId);
  const isWinner = battle.status === 'completed' && battle.winnerId === currentUserId;
  const isPending = battle.status === 'pending';
  const isInvited = isPending && me === undefined; // received invite, not creator

  const daysLeft = battle.status === 'active'
    ? Math.max(0, Math.ceil((new Date(battle.endDate).getTime() - Date.now()) / 86400000))
    : 0;

  const myScore  = me?.score ?? 0;
  const oppScore = opponent?.score ?? 0;
  const iWin     = myScore > oppScore;

  const status = STATUS_STYLE[battle.status];

  return (
    <Link href={`/battle/${battle._id}`} className="block group">
      <div className={`relative rounded-2xl bg-[#111118] border transition-all duration-200 group-hover:border-white/10 ${
        isWinner
          ? 'border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.08)]'
          : 'border-white/[0.06]'
      }`}>

        {/* Winner glow */}
        {isWinner && (
          <div className="absolute pointer-events-none inset-0 rounded-2xl bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(251,191,36,0.06),transparent)]" />
        )}

        <div className="relative p-4 space-y-4">

          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              <span className={`text-xs font-medium ${status.text}`}>
                {battle.status === 'pending' ? t('statusPending')
                  : battle.status === 'active' ? t('statusActive')
                  : t('statusCompleted')}
              </span>
              {isWinner && <FaTrophy size={11} className="text-amber-400" />}
            </div>
            <div className="flex items-center gap-1 text-zinc-600 text-xs">
              <FaClock size={10} />
              <span>{battle.duration} {t('days')}</span>
            </div>
          </div>

          {/* VS row */}
          <div className="flex items-center gap-3">

            {/* Me */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-[#7B72F8]/20 border border-[#7B72F8]/30 flex items-center justify-center">
                <span className="text-sm font-semibold text-[#7B72F8]">
                  {me?.user.username[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <span className="text-xs text-zinc-400 truncate max-w-[70px] text-center">
                {me?.user.username ?? t('you')}
              </span>
              <span className={`text-2xl font-display ${
                battle.status === 'completed'
                  ? iWin ? 'text-emerald-400' : 'text-zinc-500'
                  : 'text-[#7B72F8]'
              }`}>
                {myScore}
              </span>
            </div>

            {/* VS divider */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <GiCrossedSwords size={18} className="text-zinc-700" />
              <span className="text-[10px] font-display text-zinc-700 tracking-widest">VS</span>
            </div>

            {/* Opponent */}
            <div className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                <span className="text-sm font-semibold text-zinc-400">
                  {opponent?.user.username[0]?.toUpperCase() ?? '?'}
                </span>
              </div>
              <span className="text-xs text-zinc-400 truncate max-w-[70px] text-center">
                {opponent?.user.username ?? t('opponent')}
              </span>
              <span className={`text-2xl font-display ${
                battle.status === 'completed'
                  ? !iWin ? 'text-emerald-400' : 'text-zinc-500'
                  : 'text-zinc-400'
              }`}>
                {oppScore}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-0.5 border-t border-white/[0.04]">
            <div className="flex items-center gap-1 text-zinc-600 text-xs">
              <FaFilm size={10} />
              <span>{me?.moviesWatched ?? 0} {t('film')}</span>
            </div>
            {battle.status === 'active' && (
              <span className="text-xs text-amber-400 font-medium">
                {daysLeft} {t('daysLeft')}
              </span>
            )}
            {isInvited && onAccept && (
              <button
                onClick={(e) => { e.preventDefault(); onAccept(battle._id); }}
                className="text-xs h-6 px-2.5 rounded-lg bg-[#7B72F8]/20 border border-[#7B72F8]/30 text-[#7B72F8] font-medium hover:bg-[#7B72F8]/30 transition-all"
              >
                {t('accept')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
