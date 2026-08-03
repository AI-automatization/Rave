'use client';

import { useState } from 'react';
import { Crown, UserX, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { trackClick } from '@/lib/analytics';

const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface Props {
  /** Whether the CURRENT VIEWER owns this room (not whether the listed member does — that's the
   * per-row `isOwner` below). Gates the kick action. */
  isOwner?: boolean;
  onKick?: (targetUserId: string) => void;
}

export function MemberList({ isOwner: viewerIsOwner = false, onKick }: Props) {
  const t = useTranslations('party');
  const members = useWatchPartyStore((s) => s.members);
  const room = useWatchPartyStore((s) => s.room);
  const currentUser = useAuthStore((s) => s.user);
  // Two-tap confirm instead of a modal — kicking is real but not "type to confirm" grade
  // destructive, and a full dialog for a single-target action felt heavier than the moment needs.
  const [confirmKickId, setConfirmKickId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1 p-3">
      {members.map((member) => {
        const isOwner = room?.ownerId === member._id;
        const isMe = currentUser?._id === member._id;
        const canKick = viewerIsOwner && !isMe && !isOwner && onKick;
        const isOnline = member.isOnline !== false;
        const color = avatarColor(member.username ?? '?');
        // Real presence only — isOwner/isOnline are actual room state, no fabricated "typing"
        // indicator (there's no typing-event infrastructure on the backend to back that up).
        const statusText = isOwner ? t('host') : isOnline ? t('watchingNow') : t('offline');

        return (
          <div
            key={member._id}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="relative shrink-0">
              {member.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
                <img
                  src={member.avatar}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                  style={{ background: color }}
                >
                  {(member.username?.[0] ?? '?').toUpperCase()}
                </div>
              )}
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-[1.5px] border-[#09090B]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] font-medium text-zinc-200 truncate">
                  {member.username || `#${member._id.slice(-4)}`}
                </span>
                {isMe && <span className="text-zinc-600 text-[11px] shrink-0">{t('you')}</span>}
                {isOwner && <Crown size={10} className="text-yellow-500/70 shrink-0" />}
              </div>
              <p className={`text-[11px] truncate ${isOnline ? 'text-emerald-400/70' : 'text-zinc-600'}`}>
                {statusText}
              </p>
            </div>

            {canKick && (
              confirmKickId === member._id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { trackClick('room:kick_confirm', { targetUserId: member._id }); onKick(member._id); setConfirmKickId(null); }}
                    title={t('kickConfirm')}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 bg-red-500/[0.12] hover:bg-red-500/[0.2] transition-colors cursor-pointer"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setConfirmKickId(null)}
                    className="text-[10px] text-zinc-500 hover:text-zinc-300 px-1 cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { trackClick('room:kick_open'); setConfirmKickId(member._id); }}
                  title={t('kick')}
                  className="shrink-0 p-1.5 rounded-md text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-500/[0.08] transition-all cursor-pointer"
                >
                  <UserX size={14} />
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
