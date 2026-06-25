'use client';

import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
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

const PALETTE = ['#7B72F8', '#F87171', '#34D399', '#FBBF24', '#60A5FA', '#F472B6', '#A78BFA'];

function memberColor(id: string | undefined | null): string {
  if (!id) return PALETTE[0];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return '<1m';
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  return `${Math.floor(hr / 24)}d`;
}

export function ConversationList({ conversations, selectedPeerId, onSelect }: Props) {
  const t = useTranslations('dm');

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <MessageCircle size={48} className="text-white/10" />
        <p className="text-sm font-semibold text-white/25">{t('empty')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {conversations.map((conv, idx) => {
        const active = conv.peerId === selectedPeerId;
        const color = memberColor(conv.peerId);
        const initials = (conv.peer.username ?? '?').slice(0, 2).toUpperCase();

        return (
          <div key={conv.peerId}>
            <button
              onClick={() => onSelect(conv.peerId)}
              className={`flex items-center gap-3.5 px-4 py-3 w-full text-left transition-all cursor-pointer ${
                active ? 'bg-violet-600/[0.15] border-l-2 border-l-violet-500' : 'border-l-2 border-l-transparent hover:bg-white/[0.04]'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-base font-bold text-white overflow-hidden border-2"
                  style={{ borderColor: color, backgroundColor: `${color}22` }}
                >
                  {conv.peer.avatar ? (
                    <img src={conv.peer.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color }}>{initials}</span>
                  )}
                </div>
                {conv.peer.isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-transparent" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[15px] truncate ${conv.unreadCount > 0 ? 'font-bold text-white' : 'font-semibold text-white/75'}`}>
                    {conv.peer.username}
                  </span>
                  <span className="text-[11px] text-white/28 shrink-0">
                    {conv.lastMessage?.createdAt ? formatRelative(conv.lastMessage.createdAt) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[13px] truncate ${conv.unreadCount > 0 ? 'text-white/70 font-medium' : 'text-white/35'}`}>
                    {conv.lastMessage?.text ?? ''}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span
                      className="text-white text-[11px] font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 shrink-0"
                      style={{ backgroundColor: '#7B72F8' }}
                    >
                      {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Separator — indent to skip avatar */}
            {idx < conversations.length - 1 && (
              <div className="h-px bg-white/[0.04] ml-[78px]" />
            )}
          </div>
        );
      })}
    </div>
  );
}
