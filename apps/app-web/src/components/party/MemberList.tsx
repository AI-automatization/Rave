'use client';

import { useState } from 'react';
import { Crown, UserX, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { avatarColor } from '@/lib/utils';
import { trackClick } from '@/lib/analytics';

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
    <ul className="flex flex-col gap-0.5 overflow-y-auto p-2">
      {members.map((member) => {
        const isOwner = room?.ownerId === member._id;
        const isMe = currentUser?._id === member._id;
        const canKick = viewerIsOwner && !isMe && !isOwner && onKick;
        const isOnline = member.isOnline !== false;
        // Ilgari shu faylda o'z `avatarColor` nusxasi bor edi — bir xil
        // foydalanuvchi chatda va ro'yxatda turli rangda chiqardi.
        const color = avatarColor(member.username ?? '?');
        // Real presence only — isOwner/isOnline are actual room state, no fabricated "typing"
        // indicator (there's no typing-event infrastructure on the backend to back that up).
        const statusText = isOwner ? t('host') : isOnline ? t('watchingNow') : t('offline');

        return (
          <li
            key={member._id}
            className="group flex items-center gap-2.5 rounded-[var(--ww-r-sm)] px-2 py-1.5 transition-colors hover:bg-[var(--ww-surface-1)]"
          >
            <span className="relative shrink-0">
              {member.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar URL, not worth a next/image domain allowlist entry
                <img
                  src={member.avatar}
                  alt=""
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{ background: color }}
                >
                  {(member.username?.[0] ?? '?').toUpperCase()}
                </span>
              )}
              {isOnline && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-[var(--ww-bg)] bg-[var(--ww-online)]" />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate text-[13px] text-[var(--ww-text-2)]">
                {member.username || `#${member._id.slice(-4)}`}
                {/* Ilgari tarjimasiz "(you)" va probelsiz yopishib turardi
                    ("jasur_qa01(you)" — prod audit 2026-08-01) */}
                {isMe && (
                  <span className="text-[12px] text-[var(--ww-text-4)]">
                    ({t('memberYou')})
                  </span>
                )}
                {isOwner && (
                  <Crown
                    size={12}
                    aria-label={t('memberOwner')}
                    className="shrink-0 text-[var(--ww-gold)]"
                  />
                )}
              </span>
              <p className="truncate text-[11px] text-[var(--ww-text-4)]">{statusText}</p>
            </div>

            {canKick && (
              confirmKickId === member._id ? (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => { trackClick('room:kick_confirm', { targetUserId: member._id }); onKick(member._id); setConfirmKickId(null); }}
                    title={t('kickConfirm')}
                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-[var(--ww-danger)] bg-[var(--ww-danger)]/[0.12] transition-colors hover:bg-[var(--ww-danger)]/[0.2]"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={() => setConfirmKickId(null)}
                    className="cursor-pointer px-1 text-[10px] text-[var(--ww-text-4)] hover:text-[var(--ww-text-2)]"
                  >
                    {t('cancel')}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { trackClick('room:kick_open'); setConfirmKickId(member._id); }}
                  title={t('kick')}
                  className="shrink-0 cursor-pointer rounded-md p-1.5 text-[var(--ww-text-4)] opacity-0 transition-all hover:bg-[var(--ww-danger)]/[0.08] hover:text-[var(--ww-danger)] group-hover:opacity-100"
                >
                  <UserX size={14} />
                </button>
              )
            )}
          </li>
        );
      })}
    </ul>
  );
}
