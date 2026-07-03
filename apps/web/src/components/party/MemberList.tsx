'use client';

import { Crown } from 'lucide-react';
import { useWatchPartyStore } from '@/store/watch-party.store';
import { useAuthStore } from '@/store/auth.store';

const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];

function avatarColor(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function MemberList() {
  const members = useWatchPartyStore((s) => s.members);
  const room = useWatchPartyStore((s) => s.room);
  const currentUser = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-0.5 p-2">
      {members.map((member) => {
        const isOwner = room?.ownerId === member._id;
        const isMe = currentUser?._id === member._id;
        const color = avatarColor(member.username ?? '?');

        return (
          <div
            key={member._id}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors"
          >
            <div className="relative shrink-0">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: color }}
              >
                {(member.username?.[0] ?? '?').toUpperCase()}
              </div>
              {member.isOnline !== false && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-[1.5px] border-[#09090B]" />
              )}
            </div>

            <span className="text-sm text-zinc-300 truncate flex-1">
              {member.username || `#${member._id.slice(-4)}`}
              {isMe && <span className="text-zinc-600 text-xs ml-1">(you)</span>}
            </span>

            {isOwner && (
              <Crown size={10} className="text-yellow-500/70 shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
