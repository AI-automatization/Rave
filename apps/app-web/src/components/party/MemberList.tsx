'use client';

import { Crown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';
import { avatarColor } from '@/lib/utils';

export function MemberList() {
  const t = useTranslations('party');
  const members = useWatchPartyStore((s) => s.members);
  const room = useWatchPartyStore((s) => s.room);
  const currentUser = useAuthStore((s) => s.user);

  return (
    <ul className="flex flex-col gap-0.5 overflow-y-auto p-2">
      {members.map((member) => {
        const isOwner = room?.ownerId === member._id;
        const isMe = currentUser?._id === member._id;
        // Ilgari shu faylda o'z `avatarColor` nusxasi bor edi — bir xil
        // foydalanuvchi chatda va ro'yxatda turli rangda chiqardi.
        const color = avatarColor(member.username ?? '?');

        return (
          <li
            key={member._id}
            className="flex items-center gap-2.5 rounded-[var(--ww-r-sm)] px-2 py-1.5 transition-colors hover:bg-[var(--ww-surface-1)]"
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
              {member.isOnline !== false && (
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-[var(--ww-bg)] bg-[var(--ww-online)]" />
              )}
            </span>

            <span className="flex-1 truncate text-[13px] text-[var(--ww-text-2)]">
              {member.username || `#${member._id.slice(-4)}`}
              {/* Ilgari tarjimasiz "(you)" va probelsiz yopishib turardi
                  ("jasur_qa01(you)" — prod audit 2026-08-01) */}
              {isMe && (
                <span className="ml-1.5 text-[12px] text-[var(--ww-text-4)]">
                  ({t('memberYou')})
                </span>
              )}
            </span>

            {isOwner && (
              <Crown
                size={12}
                aria-label={t('memberOwner')}
                className="shrink-0 text-[var(--ww-gold)]"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
