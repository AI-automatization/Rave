'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { trackClick } from '@/lib/analytics';
import { memberColor } from '@/lib/dm/dm-format';
import { buildDMList, dateKeyFromDate, findJumpIndex } from '@/lib/dm/dm-date-groups';
import { useDmViewport } from '@/hooks/use-dm-viewport';
import { usePinnedMessages, useTogglePinMessage } from '@/hooks/use-dm';
import { MessageItem } from '@/components/messages/dm/MessageItem';
import { DateSeparator } from '@/components/messages/dm/DateSeparator';
import { StickyDateHeader } from '@/components/messages/dm/StickyDateHeader';
import { ChatWallpaper } from '@/components/messages/dm/ChatWallpaper';
import { MessageActionSheet } from '@/components/messages/dm/MessageActionSheet';
import { ReplyPreviewBar } from '@/components/messages/dm/ReplyPreviewBar';
import { ForwardPicker } from '@/components/messages/dm/ForwardPicker';
import { PinnedMessagesBar } from '@/components/messages/dm/PinnedMessagesBar';
import { DatePickerModal } from '@/components/messages/dm/DatePickerModal';
import { toast } from '@/store/toast.store';
import { parseApiError } from '@/lib/api-error';
import type { DmMessage } from '@/lib/api/user.api';

export interface ReplyTarget {
  replyToId: string;
  replyToText: string;
  replyToSender: string;
}

interface Props {
  messages: DmMessage[];
  onSend: (text: string, replyTo?: ReplyTarget) => void;
  peerName: string;
  peerId: string;
  onBack?: () => void;
}

export function ChatWindow({ messages, onSend, peerName, peerId, onBack }: Props) {
  const t = useTranslations('dm');
  const tCal = useTranslations('calendar');
  const currentUser = useAuthStore((s) => s.user);
  const [text, setText] = useState('');
  const [actionMsg, setActionMsg] = useState<DmMessage | null>(null);
  const [forwardMsg, setForwardMsg] = useState<DmMessage | null>(null);
  const [replyTo, setReplyTo] = useState<DmMessage | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const color = memberColor(peerId);
  const initial = peerName.slice(0, 1).toUpperCase();

  const { data: pinnedMessages } = usePinnedMessages(peerId);
  const togglePinMessage = useTogglePinMessage(peerId);

  // buildDMList/formatDayLabel are kept translator-agnostic (no next-intl import inside
  // lib/dm/dm-date-groups.ts) — this adapter is the only place next-intl meets that pure module.
  const tAdapter = useCallback(
    (ns: 'dm' | 'calendar', key: string) => (ns === 'dm' ? t(key) : tCal(key)),
    [t, tCal],
  );

  const listData = useMemo(() => buildDMList(messages, tAdapter), [messages, tAdapter]);
  const { visibleLabel, scrollActivity, registerItem, onScroll, scrollToId } = useDmViewport(
    peerId, scrollRef, listData, messages.length,
  );

  const markedDateKeys = useMemo(
    () => new Set(messages.map((m) => dateKeyFromDate(new Date(m.createdAt)))),
    [messages],
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  function handleOpenActions(message: DmMessage) {
    setActionMsg(message);
  }

  function handleReply(message: DmMessage) {
    setReplyTo(message);
  }

  function handleForward(message: DmMessage) {
    setForwardMsg(message);
  }

  function handleCopy(message: DmMessage) {
    void navigator.clipboard.writeText(message.text).then(
      () => toast.success(t('copy')),
      () => {},
    );
  }

  function handleTogglePinMessage(message: DmMessage) {
    togglePinMessage.mutate(
      { messageId: message._id, pinned: !message.pinned },
      { onError: (err) => toast.error(parseApiError(err, t('pin'))) },
    );
  }

  function handleJumpToDate() {
    setCalendarOpen(true);
  }

  function handleSelectDate(date: Date) {
    const targetKey = dateKeyFromDate(date);
    const idx = findJumpIndex(listData, targetKey);
    const item = listData[idx];
    if (item) scrollToId(item.id);
  }

  function handleJumpToPinned(message: DmMessage) {
    scrollToId(message._id);
  }

  function handleUnpinFromBar(message: DmMessage) {
    togglePinMessage.mutate(
      { messageId: message._id, pinned: false },
      { onError: (err) => toast.error(parseApiError(err, t('unpin'))) },
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    trackClick('dm:send_message', { hasReply: !!replyTo });
    onSend(
      trimmed,
      replyTo
        ? { replyToId: replyTo._id, replyToText: replyTo.text, replyToSender: replyTo.senderId === currentUser?._id ? (currentUser?.username ?? '') : peerName }
        : undefined,
    );
    setText('');
    setReplyTo(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'transparent' }}>
      {/* Header */}
      <div
        className="flex items-center gap-2.5 px-4 py-3 border-b border-white/[0.07]"
        style={{ background: 'rgba(10,7,20,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        {onBack && (
          <button
            onClick={() => { trackClick('dm:back'); onBack(); }}
            className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white transition-colors rounded-lg hover:bg-white/[0.05] cursor-pointer"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Peer avatar */}
        <div
          className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>

        <span className="text-[16px] font-bold text-white flex-1 truncate">{peerName}</span>
      </div>

      {pinnedMessages && pinnedMessages.length > 0 && (
        <PinnedMessagesBar
          pinnedMessages={pinnedMessages}
          onJump={handleJumpToPinned}
          onUnpin={handleUnpinFromBar}
        />
      )}

      {/* Messages */}
      <div className="relative flex-1 overflow-hidden">
        <ChatWallpaper />
        <StickyDateHeader label={visibleLabel} activityKey={scrollActivity} onPress={handleJumpToDate} />

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="relative h-full overflow-y-auto px-4 py-4 flex flex-col gap-2 scrollbar-hide"
        >
          {listData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-16">
              <p className="text-[15px] font-semibold text-white/28">{t('emptyTitle')}</p>
              <p className="text-[13px] text-white/18 text-center px-10">{t('emptySub')}</p>
            </div>
          ) : (
            listData.map((item) =>
              item.kind === 'date' ? (
                <div key={item.id} ref={(el) => registerItem(item.id, el)}>
                  <DateSeparator label={item.label} onPress={handleJumpToDate} />
                </div>
              ) : (
                <MessageItem
                  key={item.id}
                  message={item.message}
                  currentUserId={currentUser?._id}
                  onOpenActions={handleOpenActions}
                  registerRef={(el) => registerItem(item.id, el)}
                />
              ),
            )
          )}
        </div>
      </div>

      {/* Reply preview */}
      {replyTo && (
        <ReplyPreviewBar
          senderName={replyTo.senderId === currentUser?._id ? (currentUser?.username ?? '') : peerName}
          text={replyTo.text}
          onCancel={() => setReplyTo(null)}
        />
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 px-4 pt-2.5 pb-3 border-t border-white/[0.07]"
        style={{ background: 'rgba(10,7,20,0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('placeholder')}
          maxLength={2000}
          rows={1}
          className="glass-input flex-1 rounded-[22px] px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/45 transition-all resize-none leading-5"
          style={{ maxHeight: '120px' }}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-30"
          style={{
            backgroundColor: text.trim() ? '#7B72F8' : 'rgba(123,114,248,0.30)',
            boxShadow: text.trim() ? '0 0 12px rgba(123,114,248,0.55)' : 'none',
          }}
        >
          <Send size={16} />
        </button>
      </form>

      <MessageActionSheet
        message={actionMsg}
        onReply={handleReply}
        onForward={handleForward}
        onCopy={handleCopy}
        onTogglePin={handleTogglePinMessage}
        onClose={() => setActionMsg(null)}
      />
      <ForwardPicker message={forwardMsg} currentPeerId={peerId} onClose={() => setForwardMsg(null)} />
      <DatePickerModal
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        onSelect={handleSelectDate}
        markedDateKeys={markedDateKeys}
      />
    </div>
  );
}
