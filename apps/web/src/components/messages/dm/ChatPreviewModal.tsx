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
import { useApiError } from '@/hooks/use-api-error';
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
  const parseError = useApiError();
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
      { onError: (err) => toast.error(parseError(err, t('mute'))) },
    );
  }

  function handlePin() {
    if (!conversation) return;
    trackClick('dm:preview_toggle_pin');
    togglePin.mutate(
      { peerId: conversation.peerId, pinned: !conversation.isPinned },
      { onError: (err) => toast.error(parseError(err, t('pinLimitReached'))) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[380px] gap-0 overflow-hidden rounded-[var(--ww-r-xl)] border-[var(--ww-line)] bg-[var(--ww-panel-solid)] p-0 text-[var(--ww-text)]">
        {/* Header */}
        <div className="flex items-center gap-2.5 border-b border-[var(--ww-line)] px-4 py-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold"
            style={{ background: `${color}2E`, border: `1px solid ${color}59`, color }}
          >
            {initials}
          </span>
          <span className="truncate text-[15px] font-semibold text-[var(--ww-text)]">
            {conversation.peerUsername}
          </span>
        </div>

        {/* Read-only message preview */}
        <button
          type="button"
          onClick={() => { trackClick('dm:preview_open_full'); onOpenFull(conversation.peerId); }}
          className="flex max-h-[280px] w-full cursor-pointer flex-col gap-1.5 overflow-y-auto px-4 py-3 text-left transition-colors hover:bg-[var(--ww-surface-1)]"
        >
          {!messages || messages.length === 0 ? (
            <p className="w-full py-6 text-center text-[13px] text-[var(--ww-text-4)]">{t('noMessages')}</p>
          ) : (
            messages.map((m) => {
              const fromPeer = m.senderId === conversation.peerId;
              return (
                <div
                  key={m._id}
                  className={`min-w-0 max-w-[85%] rounded-2xl px-3 py-1.5 ${
                    fromPeer
                      ? 'self-start border border-[var(--ww-line)] bg-[var(--ww-surface-2)] text-[var(--ww-text-2)]'
                      : 'self-end bg-[var(--ww-accent)] text-white'
                  }`}
                >
                  <p className="break-words text-[13px]">{m.text}</p>
                  <span className={`text-[10px] ${fromPeer ? 'text-[var(--ww-text-4)]' : 'text-white/60'}`}>
                    {formatTime(m.createdAt)}
                  </span>
                </div>
              );
            })
          )}
        </button>

        {/* Quick actions */}
        <div className="flex flex-col border-t border-[var(--ww-line)]">
          <button
            type="button"
            onClick={handlePin}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            {conversation.isPinned ? <PinOff size={17} aria-hidden="true" /> : <Pin size={17} aria-hidden="true" />}
            {conversation.isPinned ? t('unpin') : t('pin')}
          </button>
          <button
            type="button"
            onClick={handleMute}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] text-[var(--ww-text-2)] transition-colors hover:bg-[var(--ww-surface-2)] hover:text-[var(--ww-text)]"
          >
            {conversation.isMuted ? <Bell size={17} aria-hidden="true" /> : <BellOff size={17} aria-hidden="true" />}
            {conversation.isMuted ? t('unmute') : t('mute')}
          </button>
          <button
            type="button"
            onClick={() => { trackClick('dm:preview_open_full'); onOpenFull(conversation.peerId); }}
            className="flex h-12 cursor-pointer items-center gap-3 px-4 text-[14px] font-medium text-[var(--ww-accent-hi)] transition-colors hover:bg-[var(--ww-surface-2)]"
          >
            <MessageSquare size={17} aria-hidden="true" />
            {t('openChat')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
