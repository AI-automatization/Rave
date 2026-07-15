'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle, MoreVertical, Pin, PinOff, Bell, BellOff, Eye } from 'lucide-react';
import type { Conversation } from '@/lib/api/user.api';
import { trackClick } from '@/lib/analytics';
import { memberColor, formatRelative } from '@/lib/dm/dm-format';
import { useToggleMute, useTogglePinConversation } from '@/hooks/use-dm';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { ChatPreviewModal } from '@/components/messages/dm/ChatPreviewModal';

interface Props {
  conversations: Conversation[];
  selectedPeerId: string | null;
  onSelect: (peerId: string) => void;
}

export function ConversationList({ conversations, selectedPeerId, onSelect }: Props) {
  const t = useTranslations('dm');
  const toggleMute = useToggleMute();
  const togglePin = useTogglePinConversation();
  const [previewPeerId, setPreviewPeerId] = useState<string | null>(null);

  // Pinned conversations first (stable within each group), matching mobile's ordering.
  const sorted = useMemo(
    () => [...conversations].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)),
    [conversations],
  );

  const previewConversation = conversations.find((c) => c.peerId === previewPeerId) ?? null;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
        <MessageCircle size={48} className="text-white/10" />
        <p className="text-sm font-semibold text-white/25">{t('empty')}</p>
      </div>
    );
  }

  function handleMute(conv: Conversation) {
    trackClick('dm:toggle_mute');
    toggleMute.mutate(
      { peerId: conv.peerId, muted: !conv.isMuted },
      { onError: (err) => toast.error(parseApiError(err, t('mute'))) },
    );
  }

  function handlePin(conv: Conversation) {
    trackClick('dm:toggle_pin');
    togglePin.mutate(
      { peerId: conv.peerId, pinned: !conv.isPinned },
      { onError: (err) => toast.error(parseApiError(err, t('pinLimitReached'))) },
    );
  }

  return (
    <div className="flex flex-col">
      {sorted.map((conv, idx) => {
        const active = conv.peerId === selectedPeerId;
        const color = memberColor(conv.peerId);
        const initials = (conv.peerUsername ?? '?').slice(0, 2).toUpperCase();
        const unread = conv.unreadCount > 0;

        return (
          <div key={conv.peerId} className="group relative">
            <button
              onClick={() => { trackClick('dm:select_conversation'); onSelect(conv.peerId); }}
              onContextMenu={(e) => { e.preventDefault(); trackClick('dm:preview_open'); setPreviewPeerId(conv.peerId); }}
              className={`flex items-center gap-3.5 pl-3.5 pr-10 py-3 w-full text-left transition-all cursor-pointer border-l-2 ${
                active
                  ? 'bg-violet-600/[0.15] border-l-violet-500'
                  : unread
                    ? 'border-l-violet-500/60 hover:bg-white/[0.04]'
                    : 'border-l-transparent hover:bg-white/[0.04]'
              }`}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="w-[50px] h-[50px] rounded-full flex items-center justify-center text-base font-bold text-white overflow-hidden border-2"
                  style={{ borderColor: color, backgroundColor: `${color}22` }}
                >
                  {conv.peerAvatar ? (
                    <img src={conv.peerAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span style={{ color }}>{initials}</span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                <div className="flex items-center gap-1.5">
                  {conv.isPinned && <Pin size={11} className="text-white/30 shrink-0" />}
                  {conv.isMuted && <BellOff size={11} className="text-white/30 shrink-0" />}
                  <span className={`text-[15px] truncate ${unread ? 'font-bold text-white' : 'font-semibold text-white/75'}`}>
                    {conv.peerUsername}
                  </span>
                  <span className="text-[11px] text-white/28 shrink-0 ml-auto">
                    {conv.lastMessageAt ? formatRelative(conv.lastMessageAt) : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-[13px] truncate ${unread ? 'text-white/70 font-medium' : 'text-white/35'}`}>
                    {conv.lastMessage ?? ''}
                  </p>
                  {unread && (
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

            {/* Hover/tap action menu — web replacement for long-press. md:opacity-0 keeps it
                hidden until hover on desktop, but always visible below md (no hover on touch). */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => { e.stopPropagation(); trackClick('dm:conv_menu_open'); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/[0.08] transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                  aria-label="Menu"
                >
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#16162a] border-white/[0.08] text-white/90">
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                  onClick={() => setPreviewPeerId(conv.peerId)}
                >
                  <Eye size={15} /> {t('selectChat')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                  onClick={() => handlePin(conv)}
                >
                  {conv.isPinned ? <PinOff size={15} /> : <Pin size={15} />}
                  {conv.isPinned ? t('unpin') : t('pin')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-white/[0.06] focus:text-white"
                  onClick={() => handleMute(conv)}
                >
                  {conv.isMuted ? <Bell size={15} /> : <BellOff size={15} />}
                  {conv.isMuted ? t('unmute') : t('mute')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator — indent to skip avatar */}
            {idx < sorted.length - 1 && (
              <div className="h-px bg-white/[0.04] ml-[78px]" />
            )}
          </div>
        );
      })}

      <ChatPreviewModal
        conversation={previewConversation}
        open={!!previewPeerId}
        onOpenChange={(open) => { if (!open) setPreviewPeerId(null); }}
        onOpenFull={(peerId) => { setPreviewPeerId(null); onSelect(peerId); }}
      />
    </div>
  );
}
