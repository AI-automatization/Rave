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
      <p className="text-xs text-slate-500 text-center py-8">Hali xabarlar yo&apos;q</p>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv) => {
        const active = conv.peerId === selectedPeerId;
        return (
          <button
            key={conv.peerId}
            onClick={() => onSelect(conv.peerId)}
            className={`flex items-center gap-3 px-3 py-3 text-left transition-colors cursor-pointer ${
              active ? 'bg-violet-600/10' : 'hover:bg-white/[0.03]'
            }`}
          >
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-violet-600/20 flex items-center justify-center text-sm font-bold text-violet-300 overflow-hidden">
                {conv.peer.avatar ? (
                  <img src={conv.peer.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  conv.peer.username?.[0]?.toUpperCase() ?? '?'
                )}
              </div>
              {conv.peer.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0A0A12]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white truncate">{conv.peer.username}</span>
                {conv.unreadCount > 0 && (
                  <span className="bg-violet-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 truncate">{conv.lastMessage.text}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
