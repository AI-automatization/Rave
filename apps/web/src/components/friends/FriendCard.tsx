'use client';

import type { IUser } from '@/types';

interface Props {
  user: IUser;
  onMessage?: () => void;
}

export function FriendCard({ user, onMessage }: Props) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors">
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-300 overflow-hidden">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            user.username?.[0]?.toUpperCase() ?? '?'
          )}
        </div>
        {user.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0F0E1A]" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{user.username}</p>
        {user.isOnline && (
          <p className="text-[10px] text-emerald-400">Online</p>
        )}
      </div>

      {onMessage && (
        <button
          onClick={onMessage}
          className="text-xs text-violet-400 hover:text-violet-300 transition-colors px-2 py-1 cursor-pointer"
        >
          DM
        </button>
      )}
    </div>
  );
}
