'use client';

import { useWatchPartyStore } from '@/store/watch-party.store';

export function MemberList() {
  const members = useWatchPartyStore((s) => s.members);

  return (
    <div className="flex flex-col gap-1 p-3">
      {members.map((member) => (
        <div key={member._id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-white/[0.03]">
          {/* Avatar */}
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center text-xs font-bold text-violet-300">
              {member.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            {member.isOnline !== false && (
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0F0E1A]" />
            )}
          </div>

          <span className="text-sm text-slate-200 truncate">{member.username || `#${member._id.slice(-4)}`}</span>
        </div>
      ))}
    </div>
  );
}
