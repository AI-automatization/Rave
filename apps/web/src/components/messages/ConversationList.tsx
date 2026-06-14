'use client';

import type { IUser } from '@/types';

interface Conversation {
  peerId: string;
  peer: Pick<IUser, '_id' | 'username' | 'avatar' | 'isOnline'>;
  lastMessage: { text: string; createdAt: string };
  unreadCount: number;
}

interface Props {
  conversations: Conversation[];
  selectedPeerId: string | null;
  onSelect: (peerId: string) => void;
}

export function ConversationList({ conversations, selectedPeerId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-8">Hali xabarlar yo&apos;q</p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 p-1">
      {conversations.map((conv) => {
        const active = conv.peerId === selectedPeerId;
        return (
          <button
            key={conv.peerId}
            onClick={() => onSelect(conv.peerId)}
            className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer ${
              active ? 'bg-violet-600/10 border border-violet-500/15' : 'hover:bg-white/[0.03] border border-transparent'
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-[50px] h-[50px] rounded-full bg-violet-600/20 border-2 border-violet-500/30 flex items-center justify-center text-base font-bold text-violet-300 overflow-hidden">
                {conv.peer.avatar ? (
                  <img src={conv.peer.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  conv.peer.username?.[0]?.toUpperCase() ?? '?'
                )}
              </div>
              {conv.peer.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0A0A12]" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-white' : 'font-medium text-white/80'}`}>
                  {conv.peer.username}
                </span>
                {conv.unreadCount > 0 && (
                  <span className="bg-violet-500 text-white text-[10px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-slate-300 font-medium' : 'text-slate-500'}`}>
                {conv.lastMessage.text}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
