'use client';

import { MessageCircle } from 'lucide-react';
import type { IUser } from '@/types';

const PALETTE = ['#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626', '#DB2777', '#0891B2'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

interface Props {
  user: IUser;
  onMessage?: () => void;
}

export function FriendCard({ user, onMessage }: Props) {
  const color = avatarColor(user._id);

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-violet-500/[0.04] transition-colors">
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden"
          style={{ background: `${color}30`, border: `1px solid ${color}50` }}
        >
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            <span style={{ color }}>{user.username?.[0]?.toUpperCase() ?? '?'}</span>
          )}
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#07070D]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.username}</p>
        {user.isOnline && (
          <p className="text-[11px] text-emerald-500">Online</p>
        )}
      </div>

      {/* DM button */}
      {onMessage && (
        <button
          onClick={onMessage}
          className="h-8 px-3 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.09] transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
        >
          <MessageCircle size={13} />
          DM
        </button>
      )}
    </div>
  );
}
