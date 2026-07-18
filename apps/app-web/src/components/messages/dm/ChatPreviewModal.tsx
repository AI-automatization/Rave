'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Pin, PinOff, BellOff, Bell, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { userApi } from '@/lib/api/user.api';
import type { Conversation } from '@/lib/api/user.api';
import { useToggleMute, useTogglePinConversation } from '@/hooks/use-dm';
import { memberColor, formatTime } from '@/lib/dm/dm-format';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import { trackClick } from '@/lib/analytics';

interface Props {
  conversation: Conversation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenFull: (peerId: string) => void;
}

// Web port of mobile's ChatPreviewModal.tsx — a Telegram-style "peek" opened from the
// conversation list ("…" menu or right-click, since there's no long-press on web). Read-only:
// uses a decoupled ['preview', peerId] query (staleTime 0) instead of the live chat's
// ['messages', peerId] cache, and never calls markRead/markReadUpTo — opening the peek must
// not mark anything as read.
export function ChatPreviewModal({ conversation, open, onOpenChange, onOpenFull }: Props) {
  const t = useTranslations('dm');
  const peerId = conversation?.peerId ?? null;
  const toggleMute = useToggleMute();
  const togglePin = useTogglePinConversation();

  const { data: messages } = useQuery({
    queryKey: ['preview', peerId],
    queryFn: async () => {
      if (!peerId) return [];
      const res = await userApi.getMessages(peerId);
      return Array.isArray(res.data) ? res.data.slice(-20) : [];
    },
    enabled: open && !!peerId,
    staleTime: 0,
  });

  if (!conversation) return null;
  const color = memberColor(conversation.peerId);
  const initials = (conversation.peerUsername ?? '?').slice(0, 2).toUpperCase();

  function handleMute() {
    if (!conversation) return;
    trackClick('dm:preview_toggle_mute');
    toggleMute.mutate(
      { peerId: conversation.peerId, muted: !conversation.isMuted },
      { onError: (err) => toast.error(parseApiError(err, t('mute'))) },
    );
  }

  function handlePin() {
    if (!conversation) return;
    trackClick('dm:preview_toggle_pin');
    togglePin.mutate(
      { peerId: conversation.peerId, pinned: !conversation.isPinned },
      { onError: (err) => toast.error(parseApiError(err, t('pinLimitReached'))) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0C0B18] border-white/[0.07] text-white max-w-[380px] p-0 overflow-hidden rounded-2xl gap-0">
        {/* Header */}
        <div
          className="flex items-center gap-2.5 px-4 py-3 border-b"
          style={{ borderColor: `${color}30` }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
          <span className="text-[15px] font-bold text-white truncate">{conversation.peerUsername}</span>
        </div>

        {/* Read-only message preview */}
        <button
          onClick={() => { trackClick('dm:preview_open_full'); onOpenFull(conversation.peerId); }}
          className="flex flex-col gap-1.5 px-4 py-3 max-h-[280px] overflow-y-auto text-left w-full cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          {!messages || messages.length === 0 ? (
            <p className="text-[13px] text-white/30 py-6 text-center w-full">{t('noMessages')}</p>
          ) : (
            messages.map((m) => (
              <div
                key={m._id}
                className={`max-w-[85%] min-w-0 rounded-2xl px-3 py-1.5 ${m.senderId === conversation.peerId ? 'self-start' : 'self-end'}`}
                style={{ backgroundColor: m.senderId === conversation.peerId ? '#1C1C2E' : '#7B72F8' }}
              >
                <p className="text-[13px] text-white break-words">{m.text}</p>
                <span className="text-[10px] text-white/50">{formatTime(m.createdAt)}</span>
              </div>
            ))
          )}
        </button>

        {/* Quick actions */}
        <div className="flex flex-col border-t border-white/[0.07]">
          <button
            onClick={handlePin}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/85 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            {conversation.isPinned ? <PinOff size={17} /> : <Pin size={17} />}
            {conversation.isPinned ? t('unpin') : t('pin')}
          </button>
          <button
            onClick={handleMute}
            className="flex items-center gap-3 px-4 py-3 text-sm text-white/85 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            {conversation.isMuted ? <Bell size={17} /> : <BellOff size={17} />}
            {conversation.isMuted ? t('unmute') : t('mute')}
          </button>
          <button
            onClick={() => { trackClick('dm:preview_open_full'); onOpenFull(conversation.peerId); }}
            className="flex items-center gap-3 px-4 py-3 text-sm text-violet-400 hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <MessageSquare size={17} />
            {t('selectChat')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
