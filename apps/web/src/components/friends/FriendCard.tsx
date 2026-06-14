'use client';

import { MessageCircle } from 'lucide-react';
import type { IUser } from '@/types';

interface Props {
  user: IUser;
  onMessage?: () => void;
}

export function FriendCard({ user, onMessage }: Props) {
  return (
    <div className="flex items-center gap-3.5 px-4 py-3 rounded-xl bg-[#111118] border border-white/[0.06] hover:bg-white/[0.04] transition-colors">
      {/* Avatar with online dot */}
      <div className="relative shrink-0">
        <div className="w-[50px] h-[50px] rounded-full bg-violet-600/20 border-2 border-violet-500/40 flex items-center justify-center text-base font-bold text-violet-300 overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            user.username?.[0]?.toUpperCase() ?? '?'
          )}
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#111118]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{user.username}</p>
        {user.isOnline && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Online</span>
          </div>
        )}
      </div>

      {/* DM button */}
      {onMessage && (
        <button
          onClick={onMessage}
          className="h-9 px-3 rounded-xl bg-violet-600/12 border border-violet-500/20 text-violet-400 hover:bg-violet-600/20 transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
        >
          <MessageCircle size={14} />
          DM
        </button>
      )}
    </div>
  );
}
